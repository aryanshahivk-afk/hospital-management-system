import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { ApiError } from "../api/client";
import {
  fetchDoctors,
  fetchPatients,
  fetchDepartments,
  fetchAppointments,
  fetchBills,
  fetchBillingCatalog,
  fetchEmiApplications,
  fetchEmiPlans,
  fetchReports,
  fetchDashboardStats,
  fetchRevenueTrend,
  fetchDepartmentLoad,
  createDoctorApi,
  updateDoctorApi,
  createPatientApi,
  updatePatientApi,
  createAppointmentApi,
  updateAppointmentApi,
  updateAppointmentStatusApi,
  createBillApi,
  adjustPaymentApi,
  payBillApi,
  fetchPayments,
  applyForEmiApi,
  verifyIdentityApi,
  approveEmiApi,
  rejectEmiApi,
  payInstallmentApi,
  createReportApi,
  fetchPendingOrders,
} from "../api/data";

const DataContext = createContext(null);
export const EMI_MIN = 30001;
export const EMI_MAX = 1000000;

// EmiPlans used to be keyed by billId in a plain object ({ [billId]: plan }) — the API
// returns a list, so we reshape it here to keep every page (InstallmentLadder, etc.)
// working exactly as before with zero changes.
function keyPlansByBillId(plans) {
  return Object.fromEntries(plans.map((p) => [p.billId, p]));
}

export function DataProvider({ children }) {
  const { user } = useAuth();

  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [bills, setBills] = useState([]);
  const [billingCatalog, setBillingCatalog] = useState([]);
  const [payments, setPayments] = useState([]);
  const [emiPlans, setEmiPlans] = useState({});
  const [emiApplications, setEmiApplications] = useState([]);
  const [reports, setReports] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [departmentLoad, setDepartmentLoad] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isAdmin = user?.role === "admin";
  const isDoctor = user?.role === "doctor";

  // Central refetch — call after any mutation so every screen reflects the DB immediately.
  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const tasks = [
        fetchDoctors().then(setDoctors),
        fetchPatients().then(setPatients),
        fetchDepartments().then(setDepartments),
        fetchAppointments().then(setAppointments),
        fetchReports().then(setReports),
        // The price catalog itself has no role restriction on the backend (only actually
        // creating a bill is gated to Admin/FrontDesk) — doctors need it too, to pick
        // which tests/procedures they're ordering when writing a report.
        fetchBillingCatalog().then(setBillingCatalog),
      ];
      // Billing/EMI *records* are hidden from doctors in the original app too — skip to avoid 403s.
      if (!isDoctor) {
        tasks.push(fetchBills().then(setBills));
        tasks.push(fetchPayments().then(setPayments));
        tasks.push(fetchEmiApplications().then(setEmiApplications));
        tasks.push(fetchEmiPlans().then((plans) => setEmiPlans(keyPlansByBillId(plans))));
      }
      if (isAdmin) {
        tasks.push(fetchDashboardStats().then(setDashboardStats));
        tasks.push(fetchRevenueTrend().then(setRevenueTrend));
        tasks.push(fetchDepartmentLoad().then(setDepartmentLoad));
      }
      await Promise.all(tasks);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load data from the server.");
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, isDoctor]);

  // Re-fetch everything whenever who's logged in changes (login, logout, role switch).
  const prevUserRef = useRef(null);
  useEffect(() => {
    if (user) {
      refresh();
    } else if (prevUserRef.current) {
      // logged out — clear stale data so the next login never flashes the previous user's records
      setDoctors([]);
      setPatients([]);
      setDepartments([]);
      setAppointments([]);
      setBills([]);
      setPayments([]);
      setBillingCatalog([]);
      setEmiPlans({});
      setEmiApplications([]);
      setReports([]);
      setDashboardStats(null);
      setRevenueTrend([]);
      setDepartmentLoad([]);
    }
    prevUserRef.current = user;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Wraps a mutation: runs it, refreshes on success, and — critically — never lets a
  // failed request bubble up as an uncaught rejection. Callers get { ok, data, error }
  // back so a page CAN show its own inline message, but the app never crashes either way.
  const runMutation = useCallback(async (fn) => {
    try {
      const data = await fn();
      setError("");
      await refresh();
      return { ok: true, data };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
      setError(message);
      return { ok: false, error: message };
    }
  }, [refresh]);

  // ---------- Doctors (Admin) ----------
  const addDoctor = useCallback((doctor) => runMutation(() => createDoctorApi(doctor)), [runMutation]);
  const updateDoctor = useCallback((id, doctor) => runMutation(() => updateDoctorApi(id, doctor)), [runMutation]);

  // ---------- Patients (Admin) ----------
  const addPatient = useCallback((patient) => runMutation(() => createPatientApi(patient)), [runMutation]);
  const updatePatient = useCallback((id, patient) => runMutation(() => updatePatientApi(id, patient)), [runMutation]);

  // ---------- Appointments ----------
  const createAppointment = useCallback((appt) => runMutation(() => createAppointmentApi(appt)), [runMutation]);
  const updateAppointment = useCallback((id, appt) => runMutation(() => updateAppointmentApi(id, appt)), [runMutation]);

  const updateAppointmentStatus = useCallback(
    (appointmentId, status) => runMutation(() => updateAppointmentStatusApi(appointmentId, status)),
    [runMutation]
  );

  // ---------- Billing ----------
  const adjustPayment = useCallback(
    (billId, amount, direction = "add") => runMutation(() => adjustPaymentApi(billId, amount, direction)),
    [runMutation]
  );

  const createBill = useCallback((bill) => runMutation(() => createBillApi(bill)), [runMutation]);

  const payBill = useCallback(
    (billId, paymentMethod) => runMutation(() => payBillApi(billId, paymentMethod)),
    [runMutation]
  );

  // ---------- EMI workflow ----------
  const applyForEmi = useCallback(
    (payload) => runMutation(() => applyForEmiApi(payload)),
    [runMutation]
  );

  const verifyIdentity = useCallback(
    (applicationId) => runMutation(() => verifyIdentityApi(applicationId)),
    [runMutation]
  );

  const approveEmi = useCallback(
    (applicationId, { downPayment = 0 } = {}) => runMutation(() => approveEmiApi(applicationId, downPayment)),
    [runMutation]
  );

  const rejectEmi = useCallback(
    (applicationId, reason) => runMutation(() => rejectEmiApi(applicationId, reason)),
    [runMutation]
  );

  const payInstallment = useCallback(
    (billId, installmentNumber, paymentMethod) => runMutation(() => payInstallmentApi(billId, installmentNumber, paymentMethod)),
    [runMutation]
  );

  // ---------- Reports ----------
  const addReport = useCallback((report) => runMutation(() => createReportApi(report)), [runMutation]);

  // On-demand only (not part of the global refresh, since it's scoped to one patient at
  // a time) — used by the Create Bill screen to show a doctor's unbilled test orders.
  const getPendingOrders = useCallback(async (patientId) => {
    try {
      const data = await fetchPendingOrders(patientId);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: err instanceof ApiError ? err.message : "Couldn't load pending orders." };
    }
  }, []);

  const value = {
    doctors,
    patients,
    departments,
    appointments,
    bills,
    payments,
    billingCatalog,
    emiPlans,
    emiApplications,
    reports,
    dashboardStats,
    revenueTrend,
    departmentLoad,
    loading,
    error,
    refresh,
    addPatient,
    updatePatient,
    addDoctor,
    updateDoctor,
    updateAppointmentStatus,
    createAppointment,
    updateAppointment,
    adjustPayment,
    payBill,
    createBill,
    applyForEmi,
    verifyIdentity,
    approveEmi,
    rejectEmi,
    payInstallment,
    addReport,
    getPendingOrders,
    EMI_MIN,
    EMI_MAX,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}
