using HMS.Api.Data;
using HMS.Api.Models;

namespace HMS.Api.Services;

public class AuditService
{
    private readonly AppDbContext _db;
    public AuditService(AppDbContext db) => _db = db;

    // Writes and immediately saves its own log entry, independent of whatever else the
    // caller's DbContext is doing — so a rolled-back mutation still can't accidentally
    // wipe out the record that someone attempted it.
    public async Task LogAsync(string actor, string actorRole, string category, string action)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            Timestamp = DateTime.UtcNow,
            Actor = actor,
            ActorRole = actorRole,
            Category = category,
            Action = action,
        });
        await _db.SaveChangesAsync();
    }
}
