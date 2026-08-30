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
[Route("api/appointments")]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IdGenerator _ids;
    private readonly AuditService _audit;

    public AppointmentsController(AppDbContext db, IdGenerator ids, AuditService audit)
    {
        _db = db;
        _ids = ids;
        _audit = audit;
    }

    [HttpGet]
    public async Task<ActionResult<List<Appointment>>> GetAll()
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        var refId = User.FindFirstValue("refId");

        var query = _db.Appointments.AsNoTracking().AsQueryable();
        if (role == "Doctor") query = query.Where(a => a.DoctorId == refId);
        if (role == "Patient") query = query.Where(a => a.PatientId == refId);

        return Ok(await query.OrderByDescending(a => a.Id).ToListAsync());
    }

    [HttpPost]
    [Authorize(Roles = "Admin,FrontDesk")]
    public async Task<ActionResult<Appointment>> Create(CreateAppointmentRequest req)
    {
        var patient = await _db.Patients.FindAsync(req.PatientId);
        var doctor = await _db.Doctors.FindAsync(req.DoctorId);
        if (patient == null || doctor == null) return BadRequest(new { error = "Unknown patient or doctor." });

        var appt = new Appointment
        {
            Id = await _ids.NextAsync("AP", 3300),
            PatientId = patient.Id,
            Patient = patient.Name,
            DoctorId = doctor.Id,
            Doctor = doctor.Name,
            Date = req.Date,
            Time = req.Time,
            Type = req.Type,
            Status = "Pending",
        };
        _db.Appointments.Add(appt);
        await _db.SaveChangesAsync();
        return Ok(appt);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,FrontDesk")]
    public async Task<ActionResult<Appointment>> Update(string id, UpdateAppointmentRequest req)
    {
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "Admin";
        var appt = await _db.Appointments.FindAsync(id);
        if (appt == null) return NotFound();

        var doctor = await _db.Doctors.FindAsync(req.DoctorId);
        if (doctor == null) return BadRequest(new { error = "Unknown doctor." });

        if (string.IsNullOrWhiteSpace(req.Date) || string.IsNullOrWhiteSpace(req.Time))
            return BadRequest(new { error = "Date and time are required." });

        appt.DoctorId = doctor.Id;
        appt.Doctor = doctor.Name;
        appt.Date = req.Date;
        appt.Time = req.Time;
        appt.Type = req.Type;
        await _db.SaveChangesAsync();
        await _audit.LogAsync(User.FindFirstValue(ClaimTypes.Name) ?? role, role, "Appointment", $"Rescheduled appointment {id} ({appt.Patient} with {appt.Doctor}) to {appt.Date} {appt.Time}.");
        return Ok(appt);
    }

    // Admin can confirm/cancel any appointment; a doctor may only update their own.
    [HttpPatch("{id}/status")]
    public async Task<ActionResult<Appointment>> UpdateStatus(string id, UpdateAppointmentStatusRequest req)
    {
        var appt = await _db.Appointments.FindAsync(id);
        if (appt == null) return NotFound();

        var role = User.FindFirstValue(ClaimTypes.Role);
        var refId = User.FindFirstValue("refId");
        if (role == "Doctor" && appt.DoctorId != refId) return Forbid();
        if (role == "Patient") return Forbid();

        var allowed = new[] { "Pending", "Confirmed", "Completed", "Cancelled" };
        if (!allowed.Contains(req.Status)) return BadRequest(new { error = "Invalid status." });

        appt.Status = req.Status;
        await _db.SaveChangesAsync();
        await _audit.LogAsync(User.FindFirstValue(ClaimTypes.Name) ?? role ?? "User", role ?? "Admin", "Appointment", $"Marked appointment {id} ({appt.Patient} with {appt.Doctor}) as {req.Status}.");
        return Ok(appt);
    }
}
