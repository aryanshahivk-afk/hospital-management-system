namespace HMS.Api.DTOs;

// ---------- Auth ----------
public record AdminLoginRequest(string Username, string Password);
// Doctor/Patient now log in with a private Username, same shape as Admin/FrontDesk —
// no more picking your name off a list anyone could see before signing in.
public record DoctorLoginRequest(string Username, string Password);
public record PatientLoginRequest(string Username, string Password);

public record LoginResponse(string Token, UserDto User);
public record UserDto(string Role, string Name, string? Title, string? RefId, bool MustChangePassword = false);
public record ChangePasswordRequest(string NewPassword);

// ---------- Patients ----------
public record CreatePatientRequest(string Name, int Age, string Gender, string Phone, string Department, string? DoctorId, string Username, string? Password);
public record UpdatePatientRequest(string Name, int Age, string Gender, string Phone, string Department, string? DoctorId);

// ---------- Doctors ----------
public record CreateDoctorRequest(string Name, string Specialty, string Phone, string Username, string? Password);
public record UpdateDoctorRequest(string Name, string Specialty, string Phone, string Status);

// ---------- Appointments ----------
public record CreateAppointmentRequest(string PatientId, string DoctorId, string Date, string Time, string Type);
public record UpdateAppointmentRequest(string DoctorId, string Date, string Time, string Type);
public record UpdateAppointmentStatusRequest(string Status);

// ---------- Billing ----------
public record BillLineItemInput(string? CatalogItemId, string? Description, int Quantity, decimal? Amount);
// OrderedItemIds pulls in specific doctor-ordered tests (ReportOrderedItem rows) so they
// get billed exactly once — the server marks them Billed after adding them to the bill.
public record CreateBillRequest(string PatientId, List<BillLineItemInput> Items, List<int>? OrderedItemIds);
public record AdjustPaymentRequest(decimal Amount, string Direction); // "add" | "subtract" — front desk cash only
// Patient's own direct payment on a bill (not via EMI) — full outstanding balance, via
// eSewa or Khalti. No PIN or phone number field here for the same reason as EMI
// payments: those are gateway-side credentials, never sent to this backend.
public record PayBillRequest(string PaymentMethod);

// ---------- EMI ----------
public record ApplyEmiRequest(
    string BillId, decimal Amount, int Tenure, string FullLegalName, string Address, string CitizenshipNumber,
    decimal MonthlyIncome, string NationalIdDocumentBase64, string NationalIdDocumentContentType,
    string IncomeProofDocumentBase64, string IncomeProofDocumentContentType
);
public record ApproveEmiRequest(decimal DownPayment);
public record RejectEmiRequest(string? Reason);
// PaymentMethod is "eSewa" or "Khalti". Deliberately no PIN field here — a PIN is
// something only the payment gateway itself should ever see, never the merchant's
// server, so it's checked client-side as a UX gate and never transmitted at all. This
// mirrors how eSewa/Khalti actually work in production (they redirect to their own PIN
// entry, never handing the PIN to the hospital's backend).
public record PayInstallmentRequest(int InstallmentNumber, string PaymentMethod);

// ---------- Reports ----------
// OrderedTestCatalogIds references BillingCatalog items (Lab Test/Procedure only — a
// doctor orders a test, they don't set a consultation fee or a room charge).
public record CreateReportRequest(string PatientId, string Title, string Summary, List<string>? OrderedTestCatalogIds);

// A test/procedure a doctor ordered that hasn't been billed yet — front desk sees these
// when building a bill for the patient instead of having to remember or re-ask what was done.
public record PendingOrderDto(int Id, string ReportId, string PatientId, string Description, string Category, decimal UnitPrice, string OrderedOn, string OrderedBy);

// ---------- EMI risk simulator ----------
// Admin picks a patient plus a hypothetical amount/tenure and gets the same scoring
// model back live, with no application actually created — lets front desk "what-if" a
// case before the patient even applies, and doubles as a teaching tool for how the
// score is built.
public record SimulateEmiRiskRequest(string PatientId, decimal Amount, int Tenure, decimal MonthlyIncome);

// ---------- EMI risk assessment ----------
// A DTO wrapping EmiApplication with computed risk fields so the admin sees a score,
// band, and explanation before approving — not just a bare application to rubber-stamp.
// Documents themselves are NOT included here (they can be a few MB each as base64) — the
// list view only needs to know a document exists; the actual bytes are fetched on demand
// via GET /api/emi/applications/{id}/document/{type} when front desk opens one to review.
public record EmiApplicationWithRiskDto(
    string Id, string PatientId, string Patient, string BillId, decimal Amount, int Tenure,
    string Status, bool IdentityVerified, string AppliedOn, string? RejectReason,
    int RiskScore, string RiskBand, decimal EstimatedMonthlyInstallment, int SuggestedTenureMonths, List<string> RiskReasons,
    string FullLegalName, string Address, string CitizenshipNumber,
    decimal MonthlyIncome, bool HasNationalIdDocument, bool HasIncomeProofDocument
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
