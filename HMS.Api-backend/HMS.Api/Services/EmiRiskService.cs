using HMS.Api.Data;
using HMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HMS.Api.Services;

public record RiskAssessment(int Score, string Band, decimal EstimatedMonthlyInstallment, int SuggestedTenureMonths, List<string> Reasons);

// Scores an EMI application on a 0-100 scale (higher = riskier). The primary signal is
// debt-to-income ratio (DTI) — the same core metric real banks and hospital financing
// desks use — so two patients requesting the identical loan amount can land on very
// different scores if their declared incomes differ. Secondary signals (billing history)
// nudge the score further. Every point added is traceable to a specific reason, which
// matters more for a hospital billing decision (and for defending the design in a viva)
// than an opaque black-box score would.
public class EmiRiskService
{
    // Standard real-world DTI bands: under 20% is comfortable, 20-35% is acceptable,
    // above 35% is where lenders start getting cautious, above 50% is a red flag.
    private const double DtiComfortable = 0.20;
    private const double DtiCaution = 0.35;
    private const double DtiRedFlag = 0.50;

    private readonly AppDbContext _db;
    public EmiRiskService(AppDbContext db) => _db = db;

    public async Task<RiskAssessment> AssessAsync(string patientId, decimal amount, int tenure, decimal monthlyIncome)
    {
        var reasons = new List<string>();
        var monthly = tenure > 0 ? Math.Round(amount / tenure, 2) : amount;
        var score = 0;

        // Signal 1 (primary, real-world accurate): installment as a share of the patient's
        // own declared monthly income — this is what actually makes the score different
        // for every patient, even at the exact same loan amount and tenure.
        if (monthlyIncome > 0)
        {
            var dti = (double)(monthly / monthlyIncome);
            int dtiPoints;
            if (dti <= DtiComfortable) dtiPoints = 0;
            else if (dti <= DtiCaution) dtiPoints = (int)Math.Round((dti - DtiComfortable) / (DtiCaution - DtiComfortable) * 20);
            else if (dti <= DtiRedFlag) dtiPoints = 20 + (int)Math.Round((dti - DtiCaution) / (DtiRedFlag - DtiCaution) * 25);
            else dtiPoints = 45 + (int)Math.Round(Math.Min((dti - DtiRedFlag) / 0.30, 1.0) * 25);
            score += dtiPoints;

            reasons.Add(dti > DtiCaution
                ? $"Installment would be {dti:P0} of stated monthly income (NPR {monthlyIncome:N0}/mo) — above the recommended {DtiCaution:P0} debt-to-income limit."
                : $"Installment is {dti:P0} of stated monthly income (NPR {monthlyIncome:N0}/mo) — within a healthy range.");
        }
        else
        {
            score += 20;
            reasons.Add("No verified income on file — scored with added caution until income is confirmed.");
        }

        // Signal 2 (secondary): even relative to income, a very large absolute installment
        // carries some extra risk on its own (job loss, medical costs, etc.) — small weight
        // so it nudges rather than dominates the score DTI already covers.
        const decimal HeavyMonthlyThreshold = 25000m;
        if (monthly > HeavyMonthlyThreshold)
        {
            var extra = (int)Math.Round(Math.Min((double)(monthly / HeavyMonthlyThreshold), 2.0) * 10);
            score += extra;
        }

        // Signal 3: does this patient have any other overdue bill right now?
        var hasOverdueBill = await _db.Bills.AnyAsync(b => b.PatientId == patientId && b.Status == "Overdue");
        if (hasOverdueBill)
        {
            score += 25;
            reasons.Add("Patient currently has another overdue bill on record.");
        }

        // Signal 4: has this patient had a prior EMI application rejected?
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

        // Suggest a tenure that would bring the installment back to a comfortable DTI band
        // (25% of income) instead of a fixed NPR target — realistic for any income level.
        var comfortableMonthly = monthlyIncome > 0 ? monthlyIncome * 0.25m : 12000m;
        var suggestedTenure = amount > 0 && comfortableMonthly > 0
            ? Math.Clamp((int)Math.Ceiling(amount / comfortableMonthly), 1, 24)
            : tenure;

        return new RiskAssessment(score, band, monthly, suggestedTenure, reasons);
    }
}
