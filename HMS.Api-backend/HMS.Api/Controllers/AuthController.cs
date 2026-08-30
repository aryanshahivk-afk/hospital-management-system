using System.Security.Claims;
using HMS.Api.Data;
using HMS.Api.DTOs;
using HMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtService _jwt;

    public AuthController(AppDbContext db, JwtService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    // Two distinct back-office accounts, same table, gated by SecurityRole — an Admin
    // login can never come back as a FrontDesk session or vice versa, even if someone
    // guesses the other account's username.
    [HttpPost("login/admin")]
    public async Task<ActionResult<LoginResponse>> LoginAdmin(AdminLoginRequest req) =>
        await LoginBackOffice(req, "Admin", "admin");

    [HttpPost("login/frontdesk")]
    public async Task<ActionResult<LoginResponse>> LoginFrontDesk(AdminLoginRequest req) =>
        await LoginBackOffice(req, "FrontDesk", "frontdesk");

    private async Task<ActionResult<LoginResponse>> LoginBackOffice(AdminLoginRequest req, string securityRole, string appRole)
    {
        var account = await _db.AdminAccounts.FirstOrDefaultAsync(a => a.Username == req.Username && a.SecurityRole == securityRole);
        if (account == null || !BCrypt.Net.BCrypt.Verify(req.Password, account.PasswordHash))
            return Unauthorized(new { error = "Incorrect username or password." });

        var token = _jwt.GenerateToken(account.Username, account.Name, securityRole, null);
        return Ok(new LoginResponse(token, new UserDto(appRole, account.Name, account.Title, null)));
    }

    // Doctor signs in with a private username (set by Admin at registration) — never a
    // public dropdown of every doctor's name. Username is normalized (trimmed, lowercased)
    // on both save and lookup so "Test.Doctor" and "test.doctor " always match the same account.
    [HttpPost("login/doctor")]
    public async Task<ActionResult<LoginResponse>> LoginDoctor(DoctorLoginRequest req)
    {
        var username = req.Username.Trim().ToLowerInvariant();
        var doctor = await _db.Doctors.FirstOrDefaultAsync(d => d.Username == username);
        if (doctor == null || !BCrypt.Net.BCrypt.Verify(req.Password, doctor.PasswordHash))
            return Unauthorized(new { error = "Incorrect username or password." });

        var token = _jwt.GenerateToken(doctor.Id, doctor.Name, "Doctor", doctor.Id);
        return Ok(new LoginResponse(token, new UserDto("doctor", doctor.Name, doctor.Specialty, doctor.Id, doctor.MustChangePassword)));
    }

    // Patient signs in with a private username (set at registration) — never a public
    // dropdown of every patient's name. Same normalization as doctor login above.
    [HttpPost("login/patient")]
    public async Task<ActionResult<LoginResponse>> LoginPatient(PatientLoginRequest req)
    {
        var username = req.Username.Trim().ToLowerInvariant();
        var patient = await _db.Patients.FirstOrDefaultAsync(p => p.Username == username);
        if (patient == null || !BCrypt.Net.BCrypt.Verify(req.Password, patient.PasswordHash))
            return Unauthorized(new { error = "Incorrect username or password." });

        var token = _jwt.GenerateToken(patient.Id, patient.Name, "Patient", patient.Id);
        return Ok(new LoginResponse(token, new UserDto("patient", patient.Name, patient.Id, patient.Id, patient.MustChangePassword)));
    }

    // Called right after login when the account was created with no explicit password
    // (MustChangePassword = true), forcing a real password before the account is used
    // for anything else. Works for both Doctor and Patient sessions off the same token.
    [HttpPost("change-password")]
    [Authorize(Roles = "Doctor,Patient")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.NewPassword) || req.NewPassword.Length < 6)
            return BadRequest(new { error = "New password must be at least 6 characters." });

        var role = User.FindFirstValue(ClaimTypes.Role);
        var refId = User.FindFirstValue("refId");
        if (string.IsNullOrEmpty(refId))
            return Unauthorized();

        var newHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);

        if (role == "Doctor")
        {
            var doctor = await _db.Doctors.FindAsync(refId);
            if (doctor == null) return NotFound();
            doctor.PasswordHash = newHash;
            doctor.MustChangePassword = false;
        }
        else if (role == "Patient")
        {
            var patient = await _db.Patients.FindAsync(refId);
            if (patient == null) return NotFound();
            patient.PasswordHash = newHash;
            patient.MustChangePassword = false;
        }
        else
        {
            return Forbid();
        }

        await _db.SaveChangesAsync();
        return NoContent();
    }
}
