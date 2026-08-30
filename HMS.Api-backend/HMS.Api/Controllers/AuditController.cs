using HMS.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/audit")]
[Authorize(Roles = "Admin")]
public class AuditController : ControllerBase
{
    private readonly AppDbContext _db;
    public AuditController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<object>> GetLogs([FromQuery] string? category, [FromQuery] int limit = 200)
    {
        var query = _db.AuditLogs.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(category)) query = query.Where(l => l.Category == category);

        var logs = await query
            .OrderByDescending(l => l.Timestamp)
            .Take(Math.Clamp(limit, 1, 1000))
            .ToListAsync();

        return Ok(logs);
    }
}
