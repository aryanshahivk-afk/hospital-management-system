using HMS.Api.Data;
using HMS.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize(Roles = "Admin")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;
    public DashboardController(AppDbContext db) => _db = db;

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats()
    {
        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var monthPrefix = DateTime.UtcNow.ToString("yyyy-MM");

        var totalPatients = await _db.Patients.CountAsync();
        var todayAppointments = await _db.Appointments.CountAsync(a => a.Date == today);
        var activeDoctors = await _db.Doctors.CountAsync(d => d.Status != "Off Duty");
        var pendingEmi = await _db.EmiApplications.CountAsync(a => a.Status == "Pending Verification" || a.Status == "Pending Approval");

        // SQLite can't translate SUM() over decimal columns to SQL, so pull the bills
        // into memory first and total them up in C# (fine at this data size).
        var bills = await _db.Bills.AsNoTracking().ToListAsync();
        var revenueThisMonth = bills.Where(b => b.Date.StartsWith(monthPrefix)).Sum(b => b.Paid);
        var outstanding = bills.Sum(b => b.Amount - b.Paid);

        return Ok(new DashboardStatsDto(totalPatients, todayAppointments, activeDoctors, pendingEmi, revenueThisMonth, outstanding));
    }

    // Last 6 months of revenue vs EMI collections, grouped from real Bill/EmiPlan data.
    [HttpGet("revenue-trend")]
    public async Task<ActionResult<object>> GetRevenueTrend()
    {
        var bills = await _db.Bills.AsNoTracking().ToListAsync();
        var byMonth = bills
            .GroupBy(b => b.Date.Length >= 7 ? b.Date[..7] : b.Date) // "yyyy-MM"
            .OrderBy(g => g.Key)
            .Select(g => new
            {
                month = g.Key,
                revenue = g.Sum(b => b.Paid),
                emi = g.Where(b => b.Status is "EMI Active" or "EMI Pending Approval").Sum(b => b.Paid),
            });

        return Ok(byMonth);
    }

    [HttpGet("department-load")]
    public async Task<ActionResult<object>> GetDepartmentLoad()
    {
        var departments = await _db.Departments.AsNoTracking().ToListAsync();
        return Ok(departments.Select(d => new { name = d.Name, value = d.Occupied }));
    }
}
