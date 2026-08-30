import { Outlet } from "react-router-dom";
import { LayoutGrid, Users, Stethoscope, Building2, CalendarClock, Receipt, Landmark, BarChart3, ShieldCheck, Gauge } from "lucide-react";
import Sidebar from "./Sidebar";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../context/AuthContext";

const adminNavItems = [
  { to: "/", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/doctors", label: "Doctors", icon: Stethoscope },
  { to: "/departments", label: "Departments", icon: Building2 },
  { to: "/appointments", label: "Appointments", icon: CalendarClock },
  { to: "/billing", label: "Billing", icon: Receipt },
  { to: "/emi", label: "EMI Management", icon: Landmark },
  { to: "/emi/simulator", label: "Risk Simulator", icon: Gauge, badge: true },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/audit-log", label: "Audit Log", icon: ShieldCheck },
];

// Front Desk gets the day-to-day operational tools only — no doctor/department
// management, no revenue reports, no audit log (that's oversight *over* front desk,
// so it stays admin-only), and no EMI approve/reject (a real credit decision).
const frontDeskNavItems = [
  { to: "/frontdesk", label: "Overview", icon: LayoutGrid, end: true },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/appointments", label: "Appointments", icon: CalendarClock },
  { to: "/billing", label: "Billing", icon: Receipt },
  { to: "/emi", label: "EMI Management", icon: Landmark },
  { to: "/emi/simulator", label: "Risk Simulator", icon: Gauge, badge: true },
];

// Shared shell for both back-office roles — Admin and Front Desk sign in through the
// same layout, just with a different (role-scoped) sidebar. Pages that are admin-only
// (Dashboard, Doctors, Departments, Reports, Audit Log) still individually wrap
// themselves in <ProtectedRoute allow={["admin"]}> in App.jsx, so a Front Desk session
// hitting one of those URLs directly gets redirected, not just hidden from the sidebar.
export default function AdminLayout() {
  const { user } = useAuth();
  const isFrontDesk = user?.role === "frontdesk";
  const navItems = isFrontDesk ? frontDeskNavItems : adminNavItems;

  return (
    <ProtectedRoute allow={["admin", "frontdesk"]}>
      <div className="flex min-h-screen bg-paper">
        <Sidebar
          navItems={navItems}
          roleLabel={isFrontDesk ? "Front Desk" : "Administrator"}
          userSub={isFrontDesk ? "Patients, appointments & billing" : "Full access"}
        />
        <div className="flex-1 min-w-0 flex flex-col">
          <Outlet />
        </div>
      </div>
    </ProtectedRoute>
  );
}
