namespace HMS.Api.DTOs;

// ---------- Auth ----------
public record AdminLoginRequest(string Username, string Password);
public record DoctorLoginRequest(string DoctorId, string Password);
public record PatientLoginRequest(string PatientId, string Password);

public record LoginResponse(string Token, UserDto User);
public record UserDto(string Role, string Name, string? Title, string? RefId);

// Public, password-free lists for the login dropdowns
public record LoginOptionDto(string Id, string Name);
public record DoctorLoginOptionDto(string Id, string Name, string Specialty);

// ---------- Patients ----------
public record CreatePatientRequest(string Name, int Age, string Gender, string Phone, string Department, string? DoctorId, string? Password);
public record UpdatePatientRequest(string Name, int Age, string Gender, string Phone, string Department, string? DoctorId);

// ---------- Doctors ----------
public record CreateDoctorRequest(string Name, string Specialty, string Phone, string? Password);
public record UpdateDoctorRequest(string Name, string Specialty, string Phone, string Status);

// ---------- Appointments ----------
public record CreateAppointmentRequest(string PatientId, string DoctorId, string Date, string Time, string Type);
public record UpdateAppointmentRequest(string DoctorId, string Date, string Time, string Type);
public record UpdateAppointmentStatusRequest(string Status);

// ---------- Billing ----------
public record CreateBillRequest(string PatientId, decimal Amount);
public record AdjustPaymentRequest(decimal Amount, string Direction); // "add" | "subtract"

// ---------- EMI ----------
public record ApplyEmiRequest(string BillId, decimal Amount, int Tenure, string FullLegalName, string Address, string CitizenshipNumber);
public record ApproveEmiRequest(decimal DownPayment);
public record RejectEmiRequest(string? Reason);
public record PayInstallmentRequest(int InstallmentNumber);

// ---------- Reports ----------
public record CreateReportRequest(string PatientId, string Title, string Summary);

// ---------- EMI risk simulator ----------
// Admin picks a patient plus a hypothetical amount/tenure and gets the same scoring
// model back live, with no application actually created — lets front desk "what-if" a
// case before the patient even applies, and doubles as a teaching tool for how the
// score is built.
public record SimulateEmiRiskRequest(string PatientId, decimal Amount, int Tenure);

// ---------- EMI risk assessment ----------
// A DTO wrapping EmiApplication with computed risk fields so the admin sees a score,
// band, and explanation before approving — not just a bare application to rubber-stamp.
public record EmiApplicationWithRiskDto(
    string Id, string PatientId, string Patient, string BillId, decimal Amount, int Tenure,
    string Status, bool IdentityVerified, string AppliedOn, string? RejectReason,
    int RiskScore, string RiskBand, decimal EstimatedMonthlyInstallment, int SuggestedTenureMonths, List<string> RiskReasons,
    string FullLegalName, string Address, string CitizenshipNumber
);

// ---------- Dashboard ----------
public record DashboardStatsDto(
    int TotalPatients,
    int TodayAppointments,
    int ActiveDoctors,
    int PendingEmiApprovals,
    decimal RevenueThisMonth,
    decimal OutstandingBalance
);
