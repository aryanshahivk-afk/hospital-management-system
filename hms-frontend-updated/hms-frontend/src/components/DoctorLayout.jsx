import { Outlet } from "react-router-dom";
import { LayoutGrid, Users, CalendarClock, FileText } from "lucide-react";
import Sidebar from "./Sidebar";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/doctor", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/doctor/patients", label: "My Patients", icon: Users },
  { to: "/doctor/appointments", label: "My Appointments", icon: CalendarClock },
  { to: "/doctor/reports", label: "Patient Reports", icon: FileText },
];

export default function DoctorLayout() {
  const { user } = useAuth();
  return (
    <ProtectedRoute allow={["doctor"]}>
      <div className="flex min-h-screen bg-paper">
        <Sidebar navItems={navItems} roleLabel="Doctor" userSub={user?.specialty} />
        <div className="flex-1 min-w-0 flex flex-col">
          <Outlet />
        </div>
      </div>
    </ProtectedRoute>
  );
}
