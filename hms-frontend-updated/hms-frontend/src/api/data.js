import { api, getToken, ApiError } from "./client";

// ---------- Doctors ----------
export const fetchDoctors = () => api.get("/doctors");
export const createDoctorApi = (doctor) => api.post("/doctors", doctor);
export const updateDoctorApi = (id, doctor) => api.put(`/doctors/${id}`, doctor);

// ---------- Patients ----------
export const fetchPatients = () => api.get("/patients");
export const createPatientApi = (patient) => api.post("/patients", patient);
export const updatePatientApi = (id, patient) => api.put(`/patients/${id}`, patient);

// ---------- Departments ----------
export const fetchDepartments = () => api.get("/departments");

// ---------- Appointments ----------
export const fetchAppointments = () => api.get("/appointments");
export const createAppointmentApi = (appt) => api.post("/appointments", appt);
export const updateAppointmentApi = (id, appt) => api.put(`/appointments/${id}`, appt);
export const updateAppointmentStatusApi = (id, status) =>
  api.patch(`/appointments/${id}/status`, { status });

// ---------- Billing ----------
export const fetchBills = () => api.get("/bills");
export const fetchBillingCatalog = () => api.get("/bills/catalog");
export const createBillApi = (bill) => api.post("/bills", bill);
export const adjustPaymentApi = (billId, amount, direction) =>
  api.post(`/bills/${billId}/adjust-payment`, { amount, direction });
// Patient pays their own bill directly (not via EMI) — full outstanding balance.
export const payBillApi = (billId, paymentMethod) =>
  api.post(`/bills/${billId}/pay`, { paymentMethod });
// Permanent receipt list — every payment ever made, scoped by role on the backend.
export const fetchPayments = () => api.get("/bills/payments");
// ---------- EMI ----------
export const fetchEmiApplications = () => api.get("/emi/applications");
export const fetchEmiPlans = () => api.get("/emi/plans");
export const applyForEmiApi = ({
  billId, amount, tenure, fullLegalName, address, citizenshipNumber,
  monthlyIncome, nationalIdDocumentBase64, nationalIdDocumentContentType,
  incomeProofDocumentBase64, incomeProofDocumentContentType,
}) =>
  api.post("/emi/apply", {
    billId, amount, tenure, fullLegalName, address, citizenshipNumber,
    monthlyIncome, nationalIdDocumentBase64, nationalIdDocumentContentType,
    incomeProofDocumentBase64, incomeProofDocumentContentType,
  });
export const verifyIdentityApi = (applicationId) =>
  api.post(`/emi/applications/${applicationId}/verify`);
export const approveEmiApi = (applicationId, downPayment) =>
  api.post(`/emi/applications/${applicationId}/approve`, { downPayment });
export const rejectEmiApi = (applicationId, reason) =>
  api.post(`/emi/applications/${applicationId}/reject`, { reason });
export const payInstallmentApi = (billId, installmentNumber, paymentMethod) =>
  api.post(`/emi/plans/${billId}/pay-installment`, { installmentNumber, paymentMethod });
export const simulateEmiRiskApi = (patientId, amount, tenure, monthlyIncome) =>
  api.post("/emi/simulate", { patientId, amount, tenure, monthlyIncome });

// Fetches an uploaded EMI document (needs the auth header, so it can't just be an <img src=...>
// pointed at the API directly) and hands back a blob URL the browser can display/open.
// Caller is responsible for URL.revokeObjectURL(url) when done with it.
export const fetchEmiDocumentUrl = async (applicationId, type) => {
  const token = getToken();
  const base = import.meta.env.VITE_API_BASE_URL || "https://localhost:7000/api";
  const res = await fetch(`${base}/emi/applications/${applicationId}/document/${type}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new ApiError("Couldn't load that document.", res.status);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

// ---------- Reports ----------
export const fetchReports = () => api.get("/reports");
export const createReportApi = (report) => api.post("/reports", report);
// Tests/procedures a doctor ordered for this patient that haven't been billed yet —
// front desk checks this while building a bill so nothing ordered gets missed.
export const fetchPendingOrders = (patientId) => api.get(`/reports/pending-orders/${patientId}`);

// ---------- Dashboard ----------
export const fetchDashboardStats = () => api.get("/dashboard/stats");
export const fetchRevenueTrend = () => api.get("/dashboard/revenue-trend");
export const fetchDepartmentLoad = () => api.get("/dashboard/department-load");

// ---------- Audit log ----------
export const fetchAuditLog = (category) => api.get(`/audit${category ? `?category=${encodeURIComponent(category)}` : ""}`);
