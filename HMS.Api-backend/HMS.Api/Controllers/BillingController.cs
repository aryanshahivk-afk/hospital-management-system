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

    [HttpGet]
    public async Task<ActionResult<List<Bill>>> GetAll()
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        var refId = User.FindFirstValue("refId");

        var query = _db.Bills.AsNoTracking().AsQueryable();
        if (role == "Patient") query = query.Where(b => b.PatientId == refId);
        // Doctors don't see billing in the original app; only Admin (all) and Patient (own).
        if (role == "Doctor") return Forbid();

        return Ok(await query.OrderByDescending(b => b.Id).ToListAsync());
    }

    [HttpPost]
    [Authorize(Roles = "Admin,FrontDesk")]
    public async Task<ActionResult<Bill>> Create(CreateBillRequest req)
    {
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "Admin";
        var patient = await _db.Patients.FindAsync(req.PatientId);
        if (patient == null) return BadRequest(new { error = "Unknown patient." });

        var bill = new Bill
        {
            Id = await _ids.NextAsync("BL", 5500),
            PatientId = patient.Id,
            Patient = patient.Name,
            Date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            Amount = req.Amount,
            Paid = 0,
            Status = "Overdue",
        };
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync();
        await _audit.LogAsync(User.FindFirstValue(ClaimTypes.Name) ?? role, role, "Billing", $"Created bill {bill.Id} for {patient.Name} — NPR {req.Amount:N0}.");
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
