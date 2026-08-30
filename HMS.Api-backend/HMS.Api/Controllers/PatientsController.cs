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
[Route("api/patients")]
[Authorize]
public class PatientsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IdGenerator _ids;
    private readonly AuditService _audit;

    public PatientsController(AppDbContext db, IdGenerator ids, AuditService audit)
    {
        _db = db;
        _ids = ids;
        _audit = audit;
    }

    // Admin: all patients. Doctor: only their own patients. Patient: only themself.
    [HttpGet]
    public async Task<ActionResult<List<Patient>>> GetAll()
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        var refId = User.FindFirstValue("refId");

        var query = _db.Patients.AsNoTracking().AsQueryable();
        if (role == "Doctor") query = query.Where(p => p.DoctorId == refId);
        if (role == "Patient") query = query.Where(p => p.Id == refId);

        return Ok(await query.OrderByDescending(p => p.Id).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Patient>> GetOne(string id)
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        var refId = User.FindFirstValue("refId");
        if (role == "Patient" && refId != id) return Forbid();

        var patient = await _db.Patients.FindAsync(id);
        if (patient == null) return NotFound();
        if (role == "Doctor" && patient.DoctorId != refId) return Forbid();

        return Ok(patient);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,FrontDesk")]
    public async Task<ActionResult<Patient>> Create(CreatePatientRequest req)
    {
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "Admin";

        var username = req.Username.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(username))
            return BadRequest(new { error = "Username is required." });
        if (await _db.Patients.AnyAsync(p => p.Username == username))
            return BadRequest(new { error = $"Username \"{username}\" is already taken." });

        var patient = new Patient
        {
            Id = await _ids.NextAsync("PT", 1000),
            Name = req.Name,
            Age = req.Age,
            Gender = req.Gender,
            Phone = req.Phone,
            Department = req.Department,
            DoctorId = req.DoctorId,
            Username = username,
            MustChangePassword = string.IsNullOrWhiteSpace(req.Password),
            LastVisit = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            Status = "Outpatient",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(string.IsNullOrWhiteSpace(req.Password) ? "patient123" : req.Password),
        };
        _db.Patients.Add(patient);
        await _db.SaveChangesAsync();
        await _audit.LogAsync(User.FindFirstValue(ClaimTypes.Name) ?? role, role, "Patient", $"Registered new patient {patient.Name} ({patient.Id}).");
        return CreatedAtAction(nameof(GetOne), new { id = patient.Id }, patient);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,FrontDesk")]
    public async Task<ActionResult<Patient>> Update(string id, UpdatePatientRequest req)
    {
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "Admin";
        var patient = await _db.Patients.FindAsync(id);
        if (patient == null) return NotFound();

        if (string.IsNullOrWhiteSpace(req.Name) || string.IsNullOrWhiteSpace(req.Phone))
            return BadRequest(new { error = "Name and phone are required." });

        patient.Name = req.Name.Trim();
        patient.Age = req.Age;
        patient.Gender = req.Gender;
        patient.Phone = req.Phone.Trim();
        patient.Department = req.Department;
        patient.DoctorId = req.DoctorId;
        await _db.SaveChangesAsync();
        await _audit.LogAsync(User.FindFirstValue(ClaimTypes.Name) ?? role, role, "Patient", $"Updated details for patient {patient.Name} ({patient.Id}).");
        return Ok(patient);
    }
}
