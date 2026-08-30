using HMS.Api.Data;
using HMS.Api.DTOs;
using HMS.Api.Services;
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
    // public dropdown of every doctor's name.
    [HttpPost("login/doctor")]
    public async Task<ActionResult<LoginResponse>> LoginDoctor(DoctorLoginRequest req)
    {
        var doctor = await _db.Doctors.FirstOrDefaultAsync(d => d.Username == req.Username);
        if (doctor == null || !BCrypt.Net.BCrypt.Verify(req.Password, doctor.PasswordHash))
            return Unauthorized(new { error = "Incorrect username or password." });

        var token = _jwt.GenerateToken(doctor.Id, doctor.Name, "Doctor", doctor.Id);
        return Ok(new LoginResponse(token, new UserDto("doctor", doctor.Name, doctor.Specialty, doctor.Id)));
    }

    // Patient signs in with a private username (set at registration) — never a public
    // dropdown of every patient's name.
    [HttpPost("login/patient")]
    public async Task<ActionResult<LoginResponse>> LoginPatient(PatientLoginRequest req)
    {
        var patient = await _db.Patients.FirstOrDefaultAsync(p => p.Username == req.Username);
        if (patient == null || !BCrypt.Net.BCrypt.Verify(req.Password, patient.PasswordHash))
            return Unauthorized(new { error = "Incorrect username or password." });

        var token = _jwt.GenerateToken(patient.Id, patient.Name, "Patient", patient.Id);
        return Ok(new LoginResponse(token, new UserDto("patient", patient.Name, patient.Id, patient.Id)));
    }
}
