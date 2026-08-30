import { Link } from "react-router-dom";
import { CalendarClock, Users, Clock, ShieldCheck, Receipt, Landmark, UserPlus } from "lucide-react";
import Topbar from "../components/Topbar";
import { StatCard, Card, StatusPill } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

export default function FrontDeskOverview() {
  const { user } = useAuth();
  const { appointments, patients, emiApplications } = useData();

  const todays = appointments.filter((a) => a.date === "2026-08-04");
  const pendingConfirmations = appointments.filter((a) => a.status === "Pending");
  const awaitingVerification = emiApplications.filter((a) => a.status === "Pending Verification");

  return (
    <>
      <Topbar title={`Welcome, ${user.name}`} subtitle={`${user.title} · Tuesday, August 4, 2026`} />

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Today's Appointments" value={todays.length} sub="across all doctors" icon={CalendarClock} tone="teal" />
          <StatCard label="Need Confirmation" value={pendingConfirmations.length} sub="awaiting response" icon={Clock} tone="amber" />
          <StatCard label="EMI to Verify" value={awaitingVerification.length} sub="identity check needed" icon={ShieldCheck} tone="ink" />
          <StatCard label="Total Patients" value={patients.length} sub="registered" icon={Users} tone="teal" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Link to="/patients" className="flex items-center gap-2.5 bg-white border border-line rounded-xl px-4 py-3.5 hover:border-teal/40 transition-colors">
            <span className="w-9 h-9 rounded-lg bg-teal-light text-teal flex items-center justify-center shrink-0"><UserPlus size={16} /></span>
            <span className="text-[13px] font-medium text-ink">Register patient</span>
          </Link>
          <Link to="/appointments" className="flex items-center gap-2.5 bg-white border border-line rounded-xl px-4 py-3.5 hover:border-teal/40 transition-colors">
            <span className="w-9 h-9 rounded-lg bg-teal-light text-teal flex items-center justify-center shrink-0"><CalendarClock size={16} /></span>
            <span className="text-[13px] font-medium text-ink">Book appointment</span>
          </Link>
          <Link to="/billing" className="flex items-center gap-2.5 bg-white border border-line rounded-xl px-4 py-3.5 hover:border-teal/40 transition-colors">
            <span className="w-9 h-9 rounded-lg bg-teal-light text-teal flex items-center justify-center shrink-0"><Receipt size={16} /></span>
            <span className="text-[13px] font-medium text-ink">Create bill</span>
          </Link>
          <Link to="/emi" className="flex items-center gap-2.5 bg-white border border-line rounded-xl px-4 py-3.5 hover:border-teal/40 transition-colors">
            <span className="w-9 h-9 rounded-lg bg-teal-light text-teal flex items-center justify-center shrink-0"><Landmark size={16} /></span>
            <span className="text-[13px] font-medium text-ink">EMI applications</span>
          </Link>
        </div>

        {awaitingVerification.length > 0 && (
          <Card title="Awaiting your identity verification">
            <div className="divide-y divide-line">
              {awaitingVerification.map((app) => (
                <div key={app.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-[13.5px] font-medium text-ink">{app.patient}</p>
                    <p className="text-[12px] text-slate-soft">{app.id} · Applied {app.appliedOn}</p>
                  </div>
                  <Link to="/emi" className="text-[12.5px] font-medium text-teal hover:underline">
                    Review →
                  </Link>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card title="Today's schedule">
          <div className="mt-2 divide-y divide-line">
            {todays.length === 0 && (
              <p className="px-5 py-8 text-center text-[13px] text-slate-soft">No appointments scheduled for today.</p>
            )}
            {todays.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-[13.5px] font-medium text-ink">{a.patient}</p>
                  <p className="text-[12px] text-slate-soft">with {a.doctor} · {a.type} · {a.time}</p>
                </div>
                <StatusPill status={a.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
