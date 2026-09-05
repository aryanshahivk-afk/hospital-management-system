import { UserCircle2, Contact } from "lucide-react";
import LoginForm from "../components/LoginForm";

const ROLES = [
  { key: "admin", label: "Administrator", icon: UserCircle2, home: "/", loginFn: "loginAdmin", defaultUsername: "admin", placeholder: "admin", hint: "admin / admin123" },
  { key: "frontdesk", label: "Front Desk", icon: Contact, home: "/frontdesk", loginFn: "loginFrontDesk", defaultUsername: "frontdesk", placeholder: "frontdesk", hint: "frontdesk / frontdesk123" },
];

export default function StaffLogin() {
  return (
    <LoginForm
      portalLabel="Staff"
      icon={UserCircle2}
      heroTitle="Run the front office and the hospital floor from one place."
      heroSubtitle="Admin and Front Desk sign in here — patient records, appointments, billing, and EMI approvals, all in one internal portal."
      roles={ROLES}
    />
  );
}
