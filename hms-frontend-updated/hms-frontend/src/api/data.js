import { api } from "./client";

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
export const createBillApi = (bill) => api.post("/bills", bill);
export const adjustPaymentApi = (billId, amount, direction) =>
  api.post(`/bills/${billId}/adjust-payment`, { amount, direction });

// ---------- EMI ----------
export const fetchEmiApplications = () => api.get("/emi/applications");
export const fetchEmiPlans = () => api.get("/emi/plans");
export const applyForEmiApi = ({ billId, amount, tenure, fullLegalName, address, citizenshipNumber }) =>
  api.post("/emi/apply", { billId, amount, tenure, fullLegalName, address, citizenshipNumber });
export const verifyIdentityApi = (applicationId) =>
  api.post(`/emi/applications/${applicationId}/verify`);
export const approveEmiApi = (applicationId, downPayment) =>
  api.post(`/emi/applications/${applicationId}/approve`, { downPayment });
export const rejectEmiApi = (applicationId, reason) =>
  api.post(`/emi/applications/${applicationId}/reject`, { reason });
export const payInstallmentApi = (billId, installmentNumber) =>
  api.post(`/emi/plans/${billId}/pay-installment`, { installmentNumber });
export const simulateEmiRiskApi = (patientId, amount, tenure) =>
  api.post("/emi/simulate", { patientId, amount, tenure });

// ---------- Reports ----------
export const fetchReports = () => api.get("/reports");
export const createReportApi = (report) => api.post("/reports", report);

// ---------- Dashboard ----------
export const fetchDashboardStats = () => api.get("/dashboard/stats");
export const fetchRevenueTrend = () => api.get("/dashboard/revenue-trend");
export const fetchDepartmentLoad = () => api.get("/dashboard/department-load");

// ---------- Audit log ----------
export const fetchAuditLog = (category) => api.get(`/audit${category ? `?category=${encodeURIComponent(category)}` : ""}`);
