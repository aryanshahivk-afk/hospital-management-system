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
[Route("api/emi")]
[Authorize]
public class EmiController : ControllerBase
{
    private const decimal EMI_MIN = 30001;
    private const decimal EMI_MAX = 1000000;

    private readonly AppDbContext _db;
    private readonly IdGenerator _ids;
    private readonly EmiRiskService _risk;
    private readonly AuditService _audit;

    public EmiController(AppDbContext db, IdGenerator ids, EmiRiskService risk, AuditService audit)
    {
        _db = db;
        _ids = ids;
        _risk = risk;
        _audit = audit;
    }

    [HttpGet("applications")]
    public async Task<ActionResult<List<EmiApplicationWithRiskDto>>> GetApplications()
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        var refId = User.FindFirstValue("refId");

        var query = _db.EmiApplications.AsNoTracking().AsQueryable();
        if (role == "Patient") query = query.Where(a => a.PatientId == refId);
        if (role == "Doctor") return Forbid();

        var apps = await query.OrderByDescending(a => a.Id).ToListAsync();

        // Risk is only meaningful for applications an admin might still act on — skip the
        // extra queries for ones already decided, and just echo a neutral score for those.
        var results = new List<EmiApplicationWithRiskDto>();
        foreach (var a in apps)
        {
            if (a.Status is "Approved" or "Rejected")
            {
                results.Add(new EmiApplicationWithRiskDto(
                    a.Id, a.PatientId, a.Patient, a.BillId, a.Amount, a.Tenure, a.Status, a.IdentityVerified, a.AppliedOn, a.RejectReason,
                    0, "N/A", Math.Round(a.Amount / Math.Max(a.Tenure, 1), 2), a.Tenure, new List<string> { "Already decided — risk assessed at application time." },
                    a.FullLegalName, a.Address, a.CitizenshipNumber
                ));
                continue;
            }

            var assessment = await _risk.AssessAsync(a.PatientId, a.Amount, a.Tenure);
            results.Add(new EmiApplicationWithRiskDto(
                a.Id, a.PatientId, a.Patient, a.BillId, a.Amount, a.Tenure, a.Status, a.IdentityVerified, a.AppliedOn, a.RejectReason,
                assessment.Score, assessment.Band, assessment.EstimatedMonthlyInstallment, assessment.SuggestedTenureMonths, assessment.Reasons,
                a.FullLegalName, a.Address, a.CitizenshipNumber
            ));
        }

        return Ok(results);
    }

    // Live "what-if" tool: front desk drags an amount/tenure for a real patient and gets
    // the same scoring model back instantly — no EmiApplication row is created. Useful
    // for talking a patient through options before they formally apply, and doubles as a
    // transparent demo of exactly how the risk score is built.
    [HttpPost("simulate")]
    [Authorize(Roles = "Admin,FrontDesk")]
    public async Task<ActionResult<RiskAssessment>> Simulate(SimulateEmiRiskRequest req)
    {
        var patient = await _db.Patients.FindAsync(req.PatientId);
        if (patient == null) return NotFound(new { error = "Unknown patient." });

        if (req.Amount < EMI_MIN || req.Amount > EMI_MAX)
            return BadRequest(new { error = $"EMI amount must be between NPR {EMI_MIN:N0} and NPR {EMI_MAX:N0}." });

        if (req.Tenure is < 1 or > 24)
            return BadRequest(new { error = "Tenure must be between 1 and 24 months." });

        var assessment = await _risk.AssessAsync(req.PatientId, req.Amount, req.Tenure);
        return Ok(assessment);
    }

    [HttpGet("plans")]
    public async Task<ActionResult<List<EmiPlan>>> GetPlans()
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        var refId = User.FindFirstValue("refId");

        var query = _db.EmiPlans.Include(p => p.Installments).AsNoTracking().AsQueryable();
        if (role == "Patient") query = query.Where(p => p.PatientId == refId);
        if (role == "Doctor") return Forbid();

        return Ok(await query.ToListAsync());
    }

    [HttpGet("plans/{billId}")]
    public async Task<ActionResult<EmiPlan>> GetPlan(string billId)
    {
        var plan = await _db.EmiPlans.Include(p => p.Installments).FirstOrDefaultAsync(p => p.BillId == billId);
        if (plan == null) return NotFound();

        var role = User.FindFirstValue(ClaimTypes.Role);
        var refId = User.FindFirstValue("refId");
        if (role == "Patient" && plan.PatientId != refId) return Forbid();

        return Ok(plan);
    }

    // Step 1: patient applies for EMI on an eligible bill.
    [HttpPost("apply")]
    [Authorize(Roles = "Patient")]
    public async Task<ActionResult<EmiApplication>> Apply(ApplyEmiRequest req)
    {
        var refId = User.FindFirstValue("refId")!;
        var bill = await _db.Bills.FindAsync(req.BillId);
        if (bill == null || bill.PatientId != refId) return BadRequest(new { error = "Unknown bill." });

        if (req.Amount < EMI_MIN || req.Amount > EMI_MAX)
            return BadRequest(new { error = $"EMI amount must be between NPR {EMI_MIN:N0} and NPR {EMI_MAX:N0}." });

        if (req.Tenure is < 1 or > 24)
            return BadRequest(new { error = "Tenure must be between 1 and 24 months." });

        if (string.IsNullOrWhiteSpace(req.FullLegalName) || string.IsNullOrWhiteSpace(req.Address) || string.IsNullOrWhiteSpace(req.CitizenshipNumber))
            return BadRequest(new { error = "Full legal name, address, and citizenship number are required to apply — front desk needs these to verify your identity." });

        var patient = await _db.Patients.FindAsync(refId);

        var app = new EmiApplication
        {
            Id = await _ids.NextAsync("EMI", 900),
            PatientId = refId,
            Patient = patient!.Name,
            BillId = bill.Id,
            Amount = req.Amount,
            Tenure = req.Tenure,
            Status = "Pending Verification",
            IdentityVerified = false,
            AppliedOn = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            FullLegalName = req.FullLegalName.Trim(),
            Address = req.Address.Trim(),
            CitizenshipNumber = req.CitizenshipNumber.Trim(),
        };
        _db.EmiApplications.Add(app);

        bill.Status = "EMI Pending Approval";
        await _db.SaveChangesAsync();
        await _audit.LogAsync(patient.Name, "Patient", "EMI", $"Applied for EMI of NPR {req.Amount:N0} over {req.Tenure} months on bill {bill.Id}.");
        return Ok(app);
    }

    // Step 2: front desk verifies identity.
    [HttpPost("applications/{id}/verify")]
    [Authorize(Roles = "Admin,FrontDesk")]
    public async Task<ActionResult<EmiApplication>> Verify(string id)
    {
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "Admin";
        var app = await _db.EmiApplications.FindAsync(id);
        if (app == null) return NotFound();

        app.IdentityVerified = true;
        app.Status = "Pending Approval";
        await _db.SaveChangesAsync();
        await _audit.LogAsync(User.FindFirstValue(ClaimTypes.Name) ?? role, role, "EMI", $"Verified identity for application {app.Id} ({app.Patient}).");
        return Ok(app);
    }

    // Step 3: Admin approves (a real credit/financial decision, kept separate from the front
    // desk identity check above) -> generates the installment plan.
    [HttpPost("applications/{id}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<EmiPlan>> Approve(string id, ApproveEmiRequest req)
    {
        var app = await _db.EmiApplications.FindAsync(id);
        if (app == null) return NotFound();
        if (!app.IdentityVerified) return BadRequest(new { error = "Identity must be verified before approval." });
        if (req.DownPayment < 0 || req.DownPayment > app.Amount)
            return BadRequest(new { error = "Down payment must be between 0 and the EMI amount." });

        var remaining = Math.Max(0, app.Amount - req.DownPayment);
        var monthlyAmount = Math.Round(remaining / app.Tenure, 2);
        var today = DateTime.UtcNow;

        var plan = new EmiPlan
        {
            BillId = app.BillId,
            PatientId = app.PatientId,
            Patient = app.Patient,
            TotalAmount = app.Amount,
            DownPayment = req.DownPayment,
            RemainingAmount = remaining,
            TenureMonths = app.Tenure,
            MonthlyAmount = monthlyAmount,
            ApprovedBy = User.FindFirstValue(ClaimTypes.Name) ?? "Front Desk Admin",
            ApprovedOn = today.ToString("yyyy-MM-dd"),
            Installments = Enumerable.Range(1, app.Tenure).Select(i => new Installment
            {
                Number = i,
                DueDate = today.AddMonths(i).ToString("yyyy-MM-dd"),
                Amount = monthlyAmount,
                Status = "Upcoming",
            }).ToList(),
        };
        _db.EmiPlans.Add(plan);

        var bill = await _db.Bills.FindAsync(app.BillId);
        if (bill != null)
        {
            if (req.DownPayment > 0)
                bill.Paid = Math.Min(bill.Amount, bill.Paid + req.DownPayment);
            bill.Status = "EMI Active";
        }

        app.Status = "Approved";
        await _db.SaveChangesAsync();
        await _audit.LogAsync(
            User.FindFirstValue(ClaimTypes.Name) ?? "Admin", "Admin", "EMI",
            $"Approved EMI application {app.Id} for {app.Patient} — NPR {remaining:N0} over {app.Tenure} months (down payment NPR {req.DownPayment:N0})."
        );
        return Ok(plan);
    }

    // Step 3b: front desk rejects the application instead.
    [HttpPost("applications/{id}/reject")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<EmiApplication>> Reject(string id, RejectEmiRequest req)
    {
        var app = await _db.EmiApplications.FindAsync(id);
        if (app == null) return NotFound();

        app.Status = "Rejected";
        app.RejectReason = string.IsNullOrWhiteSpace(req.Reason) ? "Did not meet approval criteria" : req.Reason;

        var bill = await _db.Bills.FindAsync(app.BillId);
        if (bill != null) bill.Status = "Overdue";

        await _db.SaveChangesAsync();
        await _audit.LogAsync(User.FindFirstValue(ClaimTypes.Name) ?? "Admin", "Admin", "EMI", $"Rejected EMI application {app.Id} for {app.Patient} — {app.RejectReason}");
        return Ok(app);
    }
    // Step 4: patient (or admin recording cash) pays one installment.
    [HttpPost("plans/{billId}/pay-installment")]
    public async Task<ActionResult<EmiPlan>> PayInstallment(string billId, PayInstallmentRequest req)
    {
        var plan = await _db.EmiPlans.Include(p => p.Installments).FirstOrDefaultAsync(p => p.BillId == billId);
        if (plan == null) return NotFound();

        var role = User.FindFirstValue(ClaimTypes.Role);
        var refId = User.FindFirstValue("refId");
        if (role == "Patient" && plan.PatientId != refId) return Forbid();
        if (role == "Doctor") return Forbid();

        var inst = plan.Installments.FirstOrDefault(i => i.Number == req.InstallmentNumber);
        if (inst == null) return NotFound(new { error = "Installment not found." });
        if (inst.Status == "Paid") return BadRequest(new { error = "Installment already paid." });

        inst.Status = "Paid";
        inst.PaidOn = DateTime.UtcNow.ToString("yyyy-MM-dd");

        var bill = await _db.Bills.FindAsync(billId);
        if (bill != null) bill.Paid = Math.Min(bill.Amount, bill.Paid + inst.Amount);

        await _db.SaveChangesAsync();
        await _audit.LogAsync(User.FindFirstValue(ClaimTypes.Name) ?? plan.Patient, role ?? "Patient", "EMI", $"Paid installment {inst.Number} (NPR {inst.Amount:N0}) on bill {billId}.");
        return Ok(plan);
    }
}
