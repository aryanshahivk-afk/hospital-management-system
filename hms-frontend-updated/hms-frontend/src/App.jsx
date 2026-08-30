import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";

import AdminLayout from "./components/AdminLayout";
import DoctorLayout from "./components/DoctorLayout";
import PatientLayout from "./components/PatientLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";

import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Doctors from "./pages/Doctors";
import Departments from "./pages/Departments";
import Appointments from "./pages/Appointments";
import Billing from "./pages/Billing";
import EmiManagement from "./pages/EmiManagement";
import RiskSimulator from "./pages/RiskSimulator";
import Reports from "./pages/Reports";
import AuditLog from "./pages/AuditLog";
import FrontDeskOverview from "./pages/FrontDeskOverview";

import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorPatients from "./pages/DoctorPatients";
import DoctorAppointments from "./pages/DoctorAppointments";
import DoctorReports from "./pages/DoctorReports";

import PatientOverview from "./pages/PatientOverview";
import PatientAppointments from "./pages/PatientAppointments";
import PatientBills from "./pages/PatientBills";
import PatientEmi from "./pages/PatientEmi";
import PatientReports from "./pages/PatientReports";

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Shared back-office shell — Admin sees everything; Front Desk sees a
                reduced sidebar (set inside AdminLayout). Admin-exclusive pages are
                individually re-guarded below so a Front Desk session can't reach them
                by typing the URL directly, even though they're inside the same shell. */}
            <Route element={<AdminLayout />}>
              <Route path="/" element={<ProtectedRoute allow={["admin"]}><Dashboard /></ProtectedRoute>} />
              <Route path="/frontdesk" element={<ProtectedRoute allow={["frontdesk"]}><FrontDeskOverview /></ProtectedRoute>} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/doctors" element={<ProtectedRoute allow={["admin"]}><Doctors /></ProtectedRoute>} />
              <Route path="/departments" element={<ProtectedRoute allow={["admin"]}><Departments /></ProtectedRoute>} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/emi" element={<EmiManagement />} />
              <Route path="/emi/simulator" element={<RiskSimulator />} />
              <Route path="/reports" element={<ProtectedRoute allow={["admin"]}><Reports /></ProtectedRoute>} />
              <Route path="/audit-log" element={<ProtectedRoute allow={["admin"]}><AuditLog /></ProtectedRoute>} />
            </Route>

            {/* Doctor — their own patients & appointments */}
            <Route element={<DoctorLayout />}>
              <Route path="/doctor" element={<DoctorDashboard />} />
              <Route path="/doctor/patients" element={<DoctorPatients />} />
              <Route path="/doctor/appointments" element={<DoctorAppointments />} />
              <Route path="/doctor/reports" element={<DoctorReports />} />
            </Route>

            {/* Patient — their own records, bills, and EMI */}
            <Route element={<PatientLayout />}>
              <Route path="/patient" element={<PatientOverview />} />
              <Route path="/patient/appointments" element={<PatientAppointments />} />
              <Route path="/patient/bills" element={<PatientBills />} />
              <Route path="/patient/emi" element={<PatientEmi />} />
              <Route path="/patient/reports" element={<PatientReports />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}
