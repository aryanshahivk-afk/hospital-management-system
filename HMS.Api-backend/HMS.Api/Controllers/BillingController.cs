using System.Security.Claims;
using HMS.Api.Data;
using HMS.Api.DTOs;
using HMS.Api.Models;
using HMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/bills")]
[Authorize]
public class BillingController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IdGenerator _ids;
    private readonly AuditService _audit;

    public BillingController(AppDbContext db, IdGenerator ids, AuditService audit)
    {
        _db = db;
        _ids = ids;
        _audit = audit;
    }

    // The published price list itself — front desk builds a bill by picking quantities
    // of these rather than typing a single arbitrary total.
    [HttpGet("catalog")]
    public ActionResult<List<CatalogItem>> GetCatalog() => Ok(BillingCatalog.Items);

    [HttpGet]
    public async Task<ActionResult<List<Bill>>> GetAll()
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        var refId = User.FindFirstValue("refId");

        var query = _db.Bills.Include(b => b.Items).AsNoTracking().AsQueryable();
        if (role == "Patient") query = query.Where(b => b.PatientId == refId);
        // Doctors don't see billing in the original app; only Admin (all) and Patient (own).
        if (role == "Doctor") return Forbid();

        return Ok(await query.OrderByDescending(b => b.Id).ToListAsync());
    }

    // A bill is now always built from real, priced line items — never a single free-typed
    // number. Each line either references a fixed catalog price (Consultation, Lab Test,
    // Procedure, Room Charge — server looks up the authoritative price, ignoring anything
    // the client sends for it), a doctor's pending test order (pulled in by id, marked
    // Billed so it can't be double-billed), or is an explicitly-labeled Pharmacy charge
    // (the one deliberately flexible category, since medicine costs vary per prescription,
    // but still itemized, described, and capped rather than an unlabeled total).
    [HttpPost]
    [Authorize(Roles = "Admin,FrontDesk")]
    public async Task<ActionResult<Bill>> Create(CreateBillRequest req)
    {
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "Admin";
        var patient = await _db.Patients.FindAsync(req.PatientId);
        if (patient == null) return BadRequest(new { error = "Unknown patient." });

        var hasManualItems = req.Items != null && req.Items.Count > 0;
        var hasOrderedItems = req.OrderedItemIds != null && req.OrderedItemIds.Count > 0;
        if (!hasManualItems && !hasOrderedItems)
            return BadRequest(new { error = "A bill needs at least one line item." });

        var lineItems = new List<BillLineItem>();
        var ordersToMarkBilled = new List<ReportOrderedItem>();

        foreach (var input in req.Items ?? new List<BillLineItemInput>())
        {
            if (input.Quantity < 1) return BadRequest(new { error = "Each line item needs a quantity of at least 1." });

            if (!string.IsNullOrWhiteSpace(input.CatalogItemId))
            {
                var catalogItem = BillingCatalog.Find(input.CatalogItemId);
                if (catalogItem == null) return BadRequest(new { error = $"Unknown price list item: {input.CatalogItemId}" });

                lineItems.Add(new BillLineItem
                {
                    Description = catalogItem.Description,
                    Category = catalogItem.Category,
                    Quantity = input.Quantity,
                    UnitPrice = catalogItem.Price, // authoritative — never the client's number
                    Amount = catalogItem.Price * input.Quantity,
                });
            }
            else
            {
                // Pharmacy / other: the one line where an amount is typed rather than
                // looked up, since medicines vary — still requires a real description and
                // is capped so it can't become a back door to an arbitrary total again.
                if (string.IsNullOrWhiteSpace(input.Description))
                    return BadRequest(new { error = "A pharmacy/other line item needs a description." });
                if (input.Amount is null || input.Amount <= 0)
                    return BadRequest(new { error = "A pharmacy/other line item needs a positive amount." });
                if (input.Amount > BillingCatalog.PharmacyMaxPerLine)
                    return BadRequest(new { error = $"A single pharmacy/other line can't exceed NPR {BillingCatalog.PharmacyMaxPerLine:N0} — split it into multiple lines if needed." });

                lineItems.Add(new BillLineItem
                {
                    Description = input.Description.Trim(),
                    Category = "Pharmacy",
                    Quantity = input.Quantity,
                    UnitPrice = Math.Round(input.Amount.Value / input.Quantity, 2),
                    Amount = input.Amount.Value,
                });
            }
        }

        foreach (var orderId in req.OrderedItemIds ?? new List<int>())
        {
            var order = await _db.ReportOrderedItems.FindAsync(orderId);
            if (order == null) return BadRequest(new { error = $"Unknown ordered test/procedure (id {orderId})." });
            if (order.PatientId != req.PatientId) return BadRequest(new { error = "That ordered item belongs to a different patient." });
            if (order.Billed) return BadRequest(new { error = $"\"{order.Description}\" has already been billed." });

            lineItems.Add(new BillLineItem
            {
                Description = order.Description,
                Category = order.Category,
                Quantity = 1,
                UnitPrice = order.UnitPrice,
                Amount = order.UnitPrice,
            });
            ordersToMarkBilled.Add(order);
        }

        var total = lineItems.Sum(li => li.Amount);

        var bill = new Bill
        {
            Id = await _ids.NextAsync("BL", 5500),
            PatientId = patient.Id,
            Patient = patient.Name,
            Date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            Amount = total,
            Paid = 0,
            Status = "Overdue",
            Items = lineItems,
        };
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync(); // save first so bill.Id is generated before we reference it below

        foreach (var order in ordersToMarkBilled)
        {
            order.Billed = true;
            order.BilledInBillId = bill.Id;
        }
        if (ordersToMarkBilled.Count > 0) await _db.SaveChangesAsync();

        var summary = string.Join(", ", lineItems.Select(li => $"{li.Description} x{li.Quantity}"));
        await _audit.LogAsync(User.FindFirstValue(ClaimTypes.Name) ?? role, role, "Billing", $"Created bill {bill.Id} for {patient.Name} — NPR {total:N0} ({summary}).");
        return Ok(bill);
    }

    // Rejects overpayment/over-refund outright instead of silently clamping — a clamped
    // no-op would otherwise still write a misleading "payment recorded" audit entry even
    // though the balance never moved. Skips recomputing Paid/Overdue status while a bill
    // is mid-EMI, since that status is driven by the installment plan instead.
    [HttpPost("{id}/adjust-payment")]
    [Authorize(Roles = "Admin,FrontDesk")]
    public async Task<ActionResult<Bill>> AdjustPayment(string id, AdjustPaymentRequest req)
    {
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "Admin";
        var bill = await _db.Bills.FindAsync(id);
        if (bill == null) return NotFound();
        if (req.Direction is not ("add" or "subtract")) return BadRequest(new { error = "Direction must be 'add' or 'subtract'." });
        if (req.Amount <= 0) return BadRequest(new { error = "Amount must be greater than zero." });

        // Reject overpayment outright rather than silently clamping it — clamping would
        // let someone "record" a payment that has no real effect, and would misleadingly
        // log that a payment happened when the balance never actually moved.
        if (req.Direction == "add" && bill.Paid >= bill.Amount)
            return BadRequest(new { error = "This bill is already fully paid — no further payment can be recorded." });

        var delta = req.Direction == "add" ? req.Amount : -req.Amount;
        var newPaid = Math.Max(0, Math.Min(bill.Amount, bill.Paid + delta));

        if (newPaid == bill.Paid)
            return BadRequest(new { error = req.Direction == "add" ? "That amount would exceed the remaining balance." : "There's no payment left to refund." });

        var status = bill.Status;
        if (status != "EMI Active" && status != "EMI Pending Approval")
        {
            status = newPaid >= bill.Amount ? "Paid" : "Overdue";
        }

        bill.Paid = newPaid;
        bill.Status = status;
        await _db.SaveChangesAsync();
        await _audit.LogAsync(
            User.FindFirstValue(ClaimTypes.Name) ?? role, role, "Billing",
            $"{(req.Direction == "add" ? "Recorded" : "Reversed")} payment of NPR {req.Amount:N0} on bill {id} ({bill.Patient})."
        );
        return Ok(bill);
    }
}
