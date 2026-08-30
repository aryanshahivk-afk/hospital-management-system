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
[Route("api/doctors")]
[Authorize]
public class DoctorsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IdGenerator _ids;
    private readonly AuditService _audit;

    public DoctorsController(AppDbContext db, IdGenerator ids, AuditService audit)
    {
        _db = db;
        _ids = ids;
        _audit = audit;
    }

    [HttpGet]
    public async Task<ActionResult<List<Doctor>>> GetAll() =>
        Ok(await _db.Doctors.AsNoTracking().OrderByDescending(d => d.Id).ToListAsync());

    [HttpGet("{id}")]
    public async Task<ActionResult<Doctor>> GetOne(string id)
    {
        var doctor = await _db.Doctors.FindAsync(id);
        return doctor == null ? NotFound() : Ok(doctor);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Doctor>> Create(CreateDoctorRequest req)
    {
        var doctor = new Doctor
        {
            Id = await _ids.NextAsync("DR", 200),
            Name = req.Name,
            Specialty = req.Specialty,
            Phone = req.Phone,
            PatientsToday = 0,
            Status = "Available",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(string.IsNullOrWhiteSpace(req.Password) ? "doctor123" : req.Password),
        };
        _db.Doctors.Add(doctor);
        await _db.SaveChangesAsync();
        await _audit.LogAsync(User.FindFirstValue(ClaimTypes.Name) ?? "Admin", "Admin", "Doctor", $"Added new doctor {doctor.Name} ({doctor.Id}), {doctor.Specialty}.");
        return CreatedAtAction(nameof(GetOne), new { id = doctor.Id }, doctor);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Doctor>> Update(string id, UpdateDoctorRequest req)
    {
        var doctor = await _db.Doctors.FindAsync(id);
        if (doctor == null) return NotFound();

        if (string.IsNullOrWhiteSpace(req.Name) || string.IsNullOrWhiteSpace(req.Phone))
            return BadRequest(new { error = "Name and phone are required." });

        var allowedStatus = new[] { "Available", "In Surgery", "Off Duty" };
        if (!allowedStatus.Contains(req.Status)) return BadRequest(new { error = "Invalid status." });

        doctor.Name = req.Name.Trim();
        doctor.Specialty = req.Specialty;
        doctor.Phone = req.Phone.Trim();
        doctor.Status = req.Status;
        await _db.SaveChangesAsync();
        await _audit.LogAsync(User.FindFirstValue(ClaimTypes.Name) ?? "Admin", "Admin", "Doctor", $"Updated details for {doctor.Name} ({doctor.Id}).");
        return Ok(doctor);
    }
}
