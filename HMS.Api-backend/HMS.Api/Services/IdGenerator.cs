using HMS.Api.Data;
using HMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HMS.Api.Services;

// Generates human-readable sequential IDs like PT-1043, DR-205, AP-3306, BL-5502, EMI-903, RPT-705.
// Mirrors the nextId() counter in the original frontend's DataContext.jsx so IDs read the same way.
public class IdGenerator
{
    private readonly AppDbContext _db;

    public IdGenerator(AppDbContext db)
    {
        _db = db;
    }

    // Deliberately does NOT call SaveChangesAsync itself. SQLite allows only one writer
    // at a time, and every caller here does a second SaveChangesAsync right after (to
    // persist the new Patient/Appointment/etc.) — two separate write transactions per
    // request roughly doubled the odds of a "database is locked" error under any
    // real-world overlap, which is exactly what caused the "works on the second click"
    // symptom. Leaving the counter as a tracked-but-unsaved change means the caller's
    // own SaveChangesAsync persists the counter and the new record together, in one
    // transaction.
    public async Task<string> NextAsync(string prefix, int startAt = 9000)
    {
        var counter = await _db.IdCounters.FirstOrDefaultAsync(c => c.Prefix == prefix);
        if (counter == null)
        {
            counter = new IdCounter { Prefix = prefix, Value = startAt };
            _db.IdCounters.Add(counter);
        }
        counter.Value += 1;
        return $"{prefix}-{counter.Value}";
    }
}