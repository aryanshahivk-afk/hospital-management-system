import { useState, useMemo } from "react";
import { CalendarClock, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

// Shows a dismissible reminder banner when the patient has a Confirmed appointment
// within the next 3 days (including today). Deliberately excludes "Pending" —
// an appointment nobody has confirmed yet isn't something to remind the patient
// about as if it's happening.
export default function AppointmentReminderBanner() {
  const { user } = useAuth();
  const { appointments } = useData();
  const [dismissedIds, setDismissedIds] = useState([]);

  const upcoming = useMemo(() => {
    if (!user?.refId) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mine = appointments
      .filter((a) => a.patientId === user.refId)
      .filter((a) => a.status === "Confirmed")
      .filter((a) => !dismissedIds.includes(a.id))
      .map((a) => {
        const apptDate = new Date(a.date);
        apptDate.setHours(0, 0, 0, 0);
        const daysUntil = Math.round((apptDate - today) / 86400000);
        return { ...a, daysUntil };
      })
      .filter((a) => a.daysUntil >= 0 && a.daysUntil <= 3)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return mine[0] || null;
  }, [appointments, user, dismissedIds]);

  if (!upcoming) return null;

  const whenLabel =
    upcoming.daysUntil === 0 ? "today" : upcoming.daysUntil === 1 ? "tomorrow" : `in ${upcoming.daysUntil} days`;

  return (
    <div className="bg-amber-light border-b border-amber/25 px-6 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
          <CalendarClock size={16} className="text-amber" />
        </div>
        <p className="text-[13px] text-ink min-w-0">
          <span className="font-semibold">Upcoming appointment {whenLabel}</span>
          <span className="text-slate">
            {" "}
            — {upcoming.doctor} on {upcoming.date} at {upcoming.time}
            {upcoming.type ? ` (${upcoming.type})` : ""}.
          </span>
        </p>
      </div>
      <button
        onClick={() => setDismissedIds((prev) => [...prev, upcoming.id])}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-amber hover:bg-white/60 transition-colors shrink-0"
        aria-label="Dismiss reminder"
      >
        <X size={15} />
      </button>
    </div>
  );
}
