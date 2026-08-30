using HMS.Api.Data;
using HMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HMS.Api.Services;

public record RiskAssessment(int Score, string Band, decimal EstimatedMonthlyInstallment, int SuggestedTenureMonths, List<string> Reasons);

// Scores an EMI application on a 0-100 scale (higher = riskier) using three signals that
// are actually available in a hospital billing context, without needing external credit
// data: (1) how heavy the monthly installment is in isolation, (2) whether this patient
// currently has any overdue bill elsewhere in the system, and (3) whether this patient has
// had a prior EMI application rejected. This is a deliberately transparent, explainable
// scoring model — every point added is traceable to a specific reason, which matters more
// for a hospital billing decision (and for defending the design in a viva) than a opaque
// black-box score would.
public class EmiRiskService
{
    // Monthly installment above this is considered a heavy burden on its own (NPR).
    private const decimal HeavyMonthlyThreshold = 25000m;
    // Target monthly installment used to suggest a more comfortable tenure.
    private const decimal ComfortableMonthlyTarget = 12000m;

    private readonly AppDbContext _db;
    public EmiRiskService(AppDbContext db) => _db = db;

    public async Task<RiskAssessment> AssessAsync(string patientId, decimal amount, int tenure)
    {
        var reasons = new List<string>();
        var monthly = tenure > 0 ? Math.Round(amount / tenure, 2) : amount;

        var score = 0;

        // Signal 1: installment burden relative to a fixed comfort threshold.
        var burdenRatio = (double)(monthly / HeavyMonthlyThreshold);
        var burdenPoints = (int)Math.Round(Math.Min(burdenRatio, 2.0) * 30); // caps at 60 pts
        score += burdenPoints;
        if (monthly > HeavyMonthlyThreshold)
            reasons.Add($"Monthly installment (NPR {monthly:N0}) is above the NPR {HeavyMonthlyThreshold:N0} comfort threshold.");

        // Signal 2: does this patient have any other overdue bill right now?
        var hasOverdueBill = await _db.Bills.AnyAsync(b => b.PatientId == patientId && b.Status == "Overdue");
        if (hasOverdueBill)
        {
            score += 25;
            reasons.Add("Patient currently has another overdue bill on record.");
        }

        // Signal 3: has this patient had a prior EMI application rejected?
        var priorRejections = await _db.EmiApplications.CountAsync(a => a.PatientId == patientId && a.Status == "Rejected");
        if (priorRejections > 0)
        {
            score += 15 * Math.Min(priorRejections, 2); // cap contribution at 30 pts
            reasons.Add($"Patient has {priorRejections} previously rejected EMI application(s).");
        }

        score = Math.Clamp(score, 0, 100);
        var band = score <= 30 ? "Low" : score <= 60 ? "Medium" : "High";

        if (reasons.Count == 0)
            reasons.Add("No risk signals found — comfortable installment size, no overdue bills, no rejection history.");

        var suggestedTenure = amount > 0 && ComfortableMonthlyTarget > 0
            ? Math.Clamp((int)Math.Ceiling(amount / ComfortableMonthlyTarget), 1, 24)
            : tenure;

        return new RiskAssessment(score, band, monthly, suggestedTenure, reasons);
    }
}
