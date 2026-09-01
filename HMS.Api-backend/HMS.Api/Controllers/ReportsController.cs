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
[Route("api/reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IdGenerator _ids;

    public ReportsController(AppDbContext db, IdGenerator ids)
    {
        _db = db;
        _ids = ids;
    }

    [HttpGet]
    public async Task<ActionResult<List<Report>>> GetAll()
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        var refId = User.FindFirstValue("refId");

        var query = _db.Reports.Include(r => r.OrderedTests).AsNoTracking().AsQueryable();
        if (role == "Patient") query = query.Where(r => r.PatientId == refId);
        if (role == "Doctor")
        {
            var patientIds = await _db.Patients.Where(p => p.DoctorId == refId).Select(p => p.Id).ToListAsync();
            query = query.Where(r => patientIds.Contains(r.PatientId));
        }

        return Ok(await query.OrderByDescending(r => r.Id).ToListAsync());
    }

    // Doctor writes a report for one of their own patients, and can order tests/procedures
    // in the same step. Ordered items are looked up from the price catalog (never a
    // client-supplied price) and stored unbilled — front desk pulls them into an actual
    // bill later via GET pending-orders + POST /api/bills with OrderedItemIds.
    [HttpPost]
    [Authorize(Roles = "Doctor,Admin")]
    public async Task<ActionResult<Report>> Create(CreateReportRequest req)
    {
        var refId = User.FindFirstValue("refId");
        var role = User.FindFirstValue(ClaimTypes.Role);
        var doctorName = User.FindFirstValue(ClaimTypes.Name) ?? "Doctor";

        var patient = await _db.Patients.FindAsync(req.PatientId);
        if (patient == null) return BadRequest(new { error = "Unknown patient." });
        if (role == "Doctor" && patient.DoctorId != refId) return Forbid();

        var orderedItems = new List<ReportOrderedItem>();
        foreach (var catalogId in req.OrderedTestCatalogIds ?? new List<string>())
        {
            var catalogItem = BillingCatalog.Find(catalogId);
            if (catalogItem == null) return BadRequest(new { error = $"Unknown test/procedure: {catalogId}" });
            if (catalogItem.Category is not ("Lab Test" or "Procedure"))
                return BadRequest(new { error = $"\"{catalogItem.Description}\" isn't an orderable test or procedure." });

            orderedItems.Add(new ReportOrderedItem
            {
                PatientId = req.PatientId,
                Description = catalogItem.Description,
                Category = catalogItem.Category,
                UnitPrice = catalogItem.Price,
                Billed = false,
            });
        }

        var report = new Report
        {
            Id = await _ids.NextAsync("RPT", 700),
            PatientId = req.PatientId,
            Date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            Doctor = doctorName,
            Title = req.Title,
            Summary = req.Summary,
            OrderedTests = orderedItems,
        };
        _db.Reports.Add(report);
        await _db.SaveChangesAsync();
        return Ok(report);
    }

    // Front desk checks this when building a bill for a patient — shows every test/
    // procedure a doctor ordered that hasn't made it onto a bill yet, so nothing gets
    // forgotten or re-typed from memory.
    [HttpGet("pending-orders/{patientId}")]
    [Authorize(Roles = "Admin,FrontDesk")]
    public async Task<ActionResult<List<PendingOrderDto>>> GetPendingOrders(string patientId)
    {
        var items = await _db.ReportOrderedItems
            .Include(o => o.Report)
            .Where(o => o.PatientId == patientId && !o.Billed)
            .OrderBy(o => o.Id)
            .ToListAsync();

        return Ok(items.Select(o => new PendingOrderDto(
            o.Id, o.ReportId, o.PatientId, o.Description, o.Category, o.UnitPrice,
            o.Report?.Date ?? "", o.Report?.Doctor ?? ""
        )).ToList());
    }
}
