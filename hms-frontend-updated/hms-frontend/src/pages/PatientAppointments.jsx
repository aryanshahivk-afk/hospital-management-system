import Topbar from "../components/Topbar";
import { StatusPill } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

export default function PatientAppointments() {
  const { user } = useAuth();
  const { appointments } = useData();
  const mine = appointments.filter((a) => a.patientId === user.refId);

  return (
    <>
      <Topbar title="My Appointments" subtitle={`${mine.length} appointments on record`} />

      <div className="p-8">
        <div className="bg-white rounded-xl border border-line overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line bg-paper-dim/40">
                {["ID", "Doctor", "Date", "Time", "Type", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-soft">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {mine.map((a) => (
                <tr key={a.id} className="hover:bg-paper-dim/30 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-[12.5px] text-slate-soft">{a.id}</td>
                  <td className="px-5 py-3.5 text-[13.5px] font-medium text-ink">{a.doctor}</td>
                  <td className="px-5 py-3.5 font-mono text-[12.5px] text-slate">{a.date}</td>
                  <td className="px-5 py-3.5 font-mono text-[12.5px] text-slate">{a.time}</td>
                  <td className="px-5 py-3.5 text-[13px] text-slate">{a.type}</td>
                  <td className="px-5 py-3.5"><StatusPill status={a.status} /></td>
                </tr>
              ))}
              {mine.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-[13px] text-slate-soft">No appointments on record.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
