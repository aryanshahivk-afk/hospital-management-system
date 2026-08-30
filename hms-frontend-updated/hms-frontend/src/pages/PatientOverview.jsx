import { CalendarClock, Receipt, FileText, Landmark } from "lucide-react";
import Topbar from "../components/Topbar";
import { StatCard, Card, StatusPill, formatNPR } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

export default function PatientOverview() {
  const { user } = useAuth();
  const { appointments, bills, reports } = useData();

  const myAppointments = appointments.filter((a) => a.patientId === user.refId);
  const myBills = bills.filter((b) => b.patientId === user.refId);
  const myReports = reports.filter((r) => r.patientId === user.refId);
  const outstanding = myBills.reduce((sum, b) => sum + Math.max(0, b.amount - b.paid), 0);
  const upcoming = myAppointments.find((a) => a.status === "Confirmed" || a.status === "Pending");

  return (
    <>
      <Topbar title={`Welcome, ${user.name}`} subtitle={`Patient ID ${user.refId}`} />

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Upcoming Appointments" value={myAppointments.filter((a) => a.status !== "Cancelled" && a.status !== "Completed").length} icon={CalendarClock} tone="teal" />
          <StatCard label="Outstanding Balance" value={formatNPR(outstanding)} icon={Receipt} tone={outstanding > 0 ? "amber" : "ink"} />
          <StatCard label="Reports on File" value={myReports.length} icon={FileText} tone="ink" />
          <StatCard label="Bills" value={myBills.length} icon={Landmark} tone="ink" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Next appointment">
            {upcoming ? (
              <div className="px-5 pb-5 pt-2">
                <p className="text-[15px] font-medium text-ink">{upcoming.doctor}</p>
                <p className="text-[12.5px] text-slate-soft mt-0.5">{upcoming.type}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="font-mono text-[13px] text-slate">{upcoming.date} · {upcoming.time}</span>
                  <StatusPill status={upcoming.status} />
                </div>
              </div>
            ) : (
              <p className="px-5 pb-6 pt-2 text-[13px] text-slate-soft">No upcoming appointments.</p>
            )}
          </Card>

          <Card title="Recent bills">
            <div className="divide-y divide-line mt-1">
              {myBills.slice(0, 3).map((b) => (
                <div key={b.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-[13px] font-medium text-ink">{b.id}</p>
                    <p className="text-[11.5px] text-slate-soft font-mono">{b.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[13px] text-ink">{formatNPR(b.amount)}</p>
                    <StatusPill status={b.status} />
                  </div>
                </div>
              ))}
              {myBills.length === 0 && <p className="px-5 py-6 text-[13px] text-slate-soft">No bills on file.</p>}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
