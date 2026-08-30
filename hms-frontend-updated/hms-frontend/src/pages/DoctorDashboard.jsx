import { CalendarClock, Users, Clock } from "lucide-react";
import Topbar from "../components/Topbar";
import { StatCard, Card, StatusPill } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { appointments, patients, updateAppointmentStatus } = useData();

  const myAppointments = appointments.filter((a) => a.doctorId === user.refId);
  const todays = myAppointments.filter((a) => a.date === "2026-08-04");
  const myPatients = patients.filter((p) => p.doctorId === user.refId);

  return (
    <>
      <Topbar title={`Welcome, ${user.name}`} subtitle={`${user.title} · Tuesday, August 4, 2026`} />

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Today's Appointments" value={todays.length} sub="scheduled for you" icon={CalendarClock} tone="teal" />
          <StatCard label="My Patients" value={myPatients.length} sub="under your care" icon={Users} tone="ink" />
          <StatCard label="Pending Confirmations" value={myAppointments.filter((a) => a.status === "Pending").length} sub="need a response" icon={Clock} tone="amber" />
        </div>

        <Card title="Today's schedule">
          <div className="mt-2 divide-y divide-line">
            {todays.length === 0 && (
              <p className="px-5 py-8 text-center text-[13px] text-slate-soft">No appointments scheduled for today.</p>
            )}
            {todays.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-[13.5px] font-medium text-ink">{a.patient}</p>
                  <p className="text-[12px] text-slate-soft">{a.type} · {a.time}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill status={a.status} />
                  {a.status === "Confirmed" && (
                    <button
                      onClick={() => updateAppointmentStatus(a.id, "Completed")}
                      className="text-[12px] font-medium text-teal hover:underline"
                    >
                      Mark seen
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
