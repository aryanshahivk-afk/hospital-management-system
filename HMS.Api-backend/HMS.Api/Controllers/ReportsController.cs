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

        var query = _db.Reports.AsNoTracking().AsQueryable();
        if (role == "Patient") query = query.Where(r => r.PatientId == refId);
        if (role == "Doctor")
        {
            var patientIds = await _db.Patients.Where(p => p.DoctorId == refId).Select(p => p.Id).ToListAsync();
            query = query.Where(r => patientIds.Contains(r.PatientId));
        }

        return Ok(await query.OrderByDescending(r => r.Id).ToListAsync());
    }

    // Doctor writes a report for one of their own patients.
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

        var report = new Report
        {
            Id = await _ids.NextAsync("RPT", 700),
            PatientId = req.PatientId,
            Date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            Doctor = doctorName,
            Title = req.Title,
            Summary = req.Summary,
        };
        _db.Reports.Add(report);
        await _db.SaveChangesAsync();
        return Ok(report);
    }
}
