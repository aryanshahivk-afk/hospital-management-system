import { Outlet } from "react-router-dom";
import { LayoutGrid, Receipt, CalendarClock, FileText, Landmark } from "lucide-react";
import Sidebar from "./Sidebar";
import ProtectedRoute from "./ProtectedRoute";

const navItems = [
  { to: "/patient", label: "Overview", icon: LayoutGrid, end: true },
  { to: "/patient/bills", label: "My Bills", icon: Receipt },
  { to: "/patient/appointments", label: "My Appointments", icon: CalendarClock },
  { to: "/patient/reports", label: "Report Card", icon: FileText },
  { to: "/patient/emi", label: "My EMI Plan", icon: Landmark },
];

export default function PatientLayout() {
  return (
    <ProtectedRoute allow={["patient"]}>
      <div className="flex min-h-screen bg-paper">
        <Sidebar navItems={navItems} roleLabel="Patient Portal" userSub="Your records" />
        <div className="flex-1 min-w-0 flex flex-col">
          <Outlet />
        </div>
      </div>
    </ProtectedRoute>
  );
}
