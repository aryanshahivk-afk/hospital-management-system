import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, User, Stethoscope, Landmark, CalendarClock, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { formatNPR } from "./ui";
import AppointmentReminderBanner from "./AppointmentReminderBanner";

const TYPE_ICON = {
  Patient: User,
  Doctor: Stethoscope,
  Bill: Landmark,
  Appointment: CalendarClock,
};

function matches(str, q) {
  return typeof str === "string" && str.toLowerCase().includes(q);
}

// Builds a small, role-scoped list of jump-to search results from data already in memory.
function buildSearchResults({ query, role, refId, navigate, doctors, patients, bills, appointments }) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results = [];

  if (role === "admin") {
    patients.filter((p) => matches(p.name, q) || matches(p.id, q)).slice(0, 4).forEach((p) =>
      results.push({ type: "Patient", label: p.name, sub: `${p.id} · ${p.department}`, go: () => navigate("/patients", { state: { query: p.name } }) })
    );
    doctors.filter((d) => matches(d.name, q) || matches(d.id, q) || matches(d.specialty, q)).slice(0, 3).forEach((d) =>
      results.push({ type: "Doctor", label: d.name, sub: `${d.id} · ${d.specialty}`, go: () => navigate("/doctors", { state: { query: d.name } }) })
    );
    bills.filter((b) => matches(b.id, q) || matches(b.patient, q)).slice(0, 3).forEach((b) =>
      results.push({ type: "Bill", label: b.id, sub: `${b.patient} · ${formatNPR(b.amount)}`, go: () => navigate("/billing", { state: { query: b.patient } }) })
    );
    appointments.filter((a) => matches(a.patient, q) || matches(a.doctor, q) || matches(a.id, q)).slice(0, 3).forEach((a) =>
      results.push({ type: "Appointment", label: `${a.patient} → ${a.doctor}`, sub: `${a.date} · ${a.time}`, go: () => navigate("/appointments", { state: { query: a.patient } }) })
    );
  } else if (role === "frontdesk") {
    patients.filter((p) => matches(p.name, q) || matches(p.id, q)).slice(0, 4).forEach((p) =>
      results.push({ type: "Patient", label: p.name, sub: `${p.id} · ${p.department}`, go: () => navigate("/patients", { state: { query: p.name } }) })
    );
    bills.filter((b) => matches(b.id, q) || matches(b.patient, q)).slice(0, 3).forEach((b) =>
      results.push({ type: "Bill", label: b.id, sub: `${b.patient} · ${formatNPR(b.amount)}`, go: () => navigate("/billing", { state: { query: b.patient } }) })
    );
    appointments.filter((a) => matches(a.patient, q) || matches(a.doctor, q) || matches(a.id, q)).slice(0, 3).forEach((a) =>
      results.push({ type: "Appointment", label: `${a.patient} → ${a.doctor}`, sub: `${a.date} · ${a.time}`, go: () => navigate("/appointments", { state: { query: a.patient } }) })
    );
  } else if (role === "doctor") {
    patients.filter((p) => matches(p.name, q) || matches(p.id, q)).slice(0, 6).forEach((p) =>
      results.push({ type: "Patient", label: p.name, sub: `${p.id} · ${p.status}`, go: () => navigate("/doctor/patients", { state: { query: p.name } }) })
    );
    appointments.filter((a) => matches(a.patient, q)).slice(0, 4).forEach((a) =>
      results.push({ type: "Appointment", label: a.patient, sub: `${a.date} · ${a.time}`, go: () => navigate("/doctor/appointments", { state: { query: a.patient } }) })
    );
  } else if (role === "patient") {
    bills.filter((b) => matches(b.id, q)).slice(0, 4).forEach((b) =>
      results.push({ type: "Bill", label: b.id, sub: formatNPR(b.amount), go: () => navigate("/patient/bills") })
    );
    appointments.filter((a) => matches(a.doctor, q) || matches(a.type, q)).slice(0, 4).forEach((a) =>
      results.push({ type: "Appointment", label: a.doctor, sub: `${a.date} · ${a.time}`, go: () => navigate("/patient/appointments") })
    );
  }

  return results.slice(0, 8);
}

// Builds a role-scoped notification feed from real, already-loaded data — no separate
// "notifications" table needed; these are just the things that actually need attention.
function buildNotifications({ role, refId, navigate, appointments, bills, emiApplications, emiPlans }) {
  const items = [];
  const today = new Date().toISOString().slice(0, 10);

  // Surfaces installments paid today, across every patient's plan — used for both the
  // "patient just paid" alert to staff and the payer's own confirmation.
  const todaysPayments = Object.values(emiPlans).flatMap((p) =>
    (p.installments || [])
      .filter((i) => i.status === "Paid" && i.paidOn === today && i.paymentMethod)
      .map((i) => ({ plan: p, installment: i }))
  );

  if (role === "admin") {
    todaysPayments.forEach(({ plan, installment }) =>
      items.push({
        icon: Landmark,
        text: `${plan.patient} paid installment ${installment.number} (${formatNPR(installment.amount)}) via ${installment.paymentMethod}${installment.number === 1 ? " — their 1st EMI payment" : ""}`,
        go: () => navigate("/emi"),
      })
    );
    emiApplications
      .filter((a) => a.status === "Pending Verification" || a.status === "Pending Approval")
      .forEach((a) =>
        items.push({
          icon: Landmark,
          text: `${a.patient}'s EMI application needs ${a.status === "Pending Verification" ? "identity verification" : "approval"}`,
          go: () => navigate("/emi"),
        })
      );
    appointments
      .filter((a) => a.status === "Pending")
      .slice(0, 5)
      .forEach((a) => items.push({ icon: CalendarClock, text: `${a.patient}'s appointment with ${a.doctor} needs confirmation`, go: () => navigate("/appointments") }));
    bills
      .filter((b) => b.status === "Overdue")
      .slice(0, 5)
      .forEach((b) => items.push({ icon: AlertCircle, text: `Bill ${b.id} for ${b.patient} is overdue`, go: () => navigate("/billing") }));
  } else if (role === "frontdesk") {
    todaysPayments.forEach(({ plan, installment }) =>
      items.push({
        icon: Landmark,
        text: `${plan.patient} paid installment ${installment.number} (${formatNPR(installment.amount)}) via ${installment.paymentMethod}${installment.number === 1 ? " — their 1st EMI payment" : ""}`,
        go: () => navigate("/emi"),
      })
    );
    emiApplications
      .filter((a) => a.status === "Pending Verification")
      .forEach((a) =>
        items.push({ icon: Landmark, text: `${a.patient}'s EMI application needs identity verification`, go: () => navigate("/emi") })
      );
    appointments
      .filter((a) => a.status === "Pending")
      .slice(0, 5)
      .forEach((a) => items.push({ icon: CalendarClock, text: `${a.patient}'s appointment with ${a.doctor} needs confirmation`, go: () => navigate("/appointments") }));
    bills
      .filter((b) => b.status === "Overdue")
      .slice(0, 5)
      .forEach((b) => items.push({ icon: AlertCircle, text: `Bill ${b.id} for ${b.patient} is overdue`, go: () => navigate("/billing") }));
  } else if (role === "doctor") {
    appointments
      .filter((a) => a.doctorId === refId && a.status === "Pending")
      .forEach((a) => items.push({ icon: CalendarClock, text: `${a.patient} is awaiting your confirmation`, go: () => navigate("/doctor/appointments") }));
  } else if (role === "patient") {
    todaysPayments
      .filter(({ plan }) => plan.patientId === refId)
      .forEach(({ installment }) =>
        items.push({
          icon: CheckCircle2,
          text: `You paid installment ${installment.number} (${formatNPR(installment.amount)}) via ${installment.paymentMethod}${installment.number === 1 ? " — your 1st EMI payment" : ""}`,
          go: () => navigate("/patient/emi"),
        })
      );
    emiApplications
      .filter((a) => a.patientId === refId && (a.status === "Approved" || a.status === "Rejected"))
      .forEach((a) =>
        items.push({
          icon: a.status === "Approved" ? Landmark : AlertCircle,
          text: a.status === "Approved" ? `Your EMI plan for bill ${a.billId} was approved` : `Your EMI application for bill ${a.billId} was rejected`,
          go: () => navigate("/patient/emi"),
        })
      );
    Object.values(emiPlans)
      .filter((p) => p.patientId === refId)
      .forEach((p) => {
        const next = p.installments?.find((i) => i.status !== "Paid");
        if (next) items.push({ icon: FileText, text: `Installment ${next.number} (${formatNPR(next.amount)}) due ${next.dueDate}`, go: () => navigate("/patient/emi") });
      });
  }

  return items.slice(0, 8);
}

export default function Topbar({ title, subtitle }) {
  const { user } = useAuth();
  const { doctors, patients, bills, appointments, emiApplications, emiPlans } = useData();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const searchRef = useRef(null);
  const notifRef = useRef(null);

  const results = useMemo(
    () => buildSearchResults({ query, role: user?.role, refId: user?.refId, navigate, doctors, patients, bills, appointments }),
    [query, user, navigate, doctors, patients, bills, appointments]
  );

  const notifications = useMemo(
    () => buildNotifications({ role: user?.role, refId: user?.refId, navigate, appointments, bills, emiApplications, emiPlans }),
    [user, navigate, appointments, bills, emiApplications, emiPlans]
  );

  // Close either dropdown on an outside click or Escape.
  useEffect(() => {
    function onClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocused(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") {
        setSearchFocused(false);
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function selectResult(r) {
    r.go();
    setQuery("");
    setSearchFocused(false);
  }

  return (
    <>
      <header className="h-20 shrink-0 border-b border-line bg-paper/80 backdrop-blur px-8 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="font-display text-[22px] font-semibold text-ink leading-tight">{title}</h1>
          {subtitle && <p className="text-[13px] text-slate-soft mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block" ref={searchRef}>
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-soft" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Search patients, doctors, bills…"
              className="w-72 pl-9 pr-3 py-2.5 rounded-lg border border-line bg-white text-[13px] placeholder:text-slate-soft focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
            />

            {searchFocused && query.trim() && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-line rounded-lg shadow-lg py-1.5 max-h-96 overflow-y-auto z-20">
                {results.length === 0 && (
                  <p className="px-4 py-3 text-[12.5px] text-slate-soft">No matches for "{query}".</p>
                )}
                {results.map((r, i) => {
                  const Icon = TYPE_ICON[r.type] || Search;
                  return (
                    <button
                      key={i}
                      onClick={() => selectResult(r)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-paper-dim/60 transition-colors"
                    >
                      <span className="w-8 h-8 rounded-lg bg-teal-light text-teal flex items-center justify-center shrink-0">
                        <Icon size={14} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-medium text-ink truncate">{r.label}</span>
                        <span className="block text-[11.5px] text-slate-soft truncate">{r.sub}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative w-10 h-10 rounded-lg border border-line bg-white flex items-center justify-center hover:bg-paper-dim transition-colors"
            >
              <Bell size={16} className="text-slate" />
              {notifications.length > 0 && <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-amber" />}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-line rounded-lg shadow-lg py-1.5 max-h-96 overflow-y-auto z-20">
                <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-soft">Notifications</p>
                {notifications.length === 0 && (
                  <p className="px-4 py-3 text-[12.5px] text-slate-soft">You're all caught up.</p>
                )}
                {notifications.map((n, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      n.go();
                      setNotifOpen(false);
                    }}
                    className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-paper-dim/60 transition-colors"
                  >
                    <span className="w-8 h-8 rounded-lg bg-amber-light text-amber flex items-center justify-center shrink-0 mt-0.5">
                      <n.icon size={14} />
                    </span>
                    <span className="text-[12.5px] text-slate leading-snug">{n.text}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>
      {user?.role === "patient" && <AppointmentReminderBanner />}
    </>
  );
}
