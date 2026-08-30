import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Check, X, Stethoscope, Search } from "lucide-react";
import Topbar from "../components/Topbar";
import { StatusPill } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

export default function DoctorAppointments() {
  const { user } = useAuth();
  const { appointments, updateAppointmentStatus } = useData();
  const routerLocation = useLocation();
  const [query, setQuery] = useState(routerLocation.state?.query || "");
  const mine = appointments
    .filter((a) => a.doctorId === user.refId)
    .filter((a) => !query.trim() || a.patient.toLowerCase().includes(query.toLowerCase()) || a.id.toLowerCase().includes(query.toLowerCase()));
  const [busyRow, setBusyRow] = useState(null);
  const [rowError, setRowError] = useState("");

  async function handleStatusChange(id, status) {
    setBusyRow(id);
    setRowError("");
    const result = await updateAppointmentStatus(id, status);
    setBusyRow(null);
    if (!result.ok) setRowError(result.error);
  }

  return (
    <>
      <Topbar title="My Appointments" subtitle={`${mine.length} appointments across all dates`} />

      <div className="p-8">
        <div className="relative w-full max-w-xs mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search appointments…"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-line bg-white text-[13px] placeholder:text-slate-soft focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
          />
        </div>
        <div className="bg-white rounded-xl border border-line overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line bg-paper-dim/40">
                {["ID", "Patient", "Date", "Time", "Type", "Status", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-soft">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {mine.map((a) => (
                <tr key={a.id} className="hover:bg-paper-dim/30 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-[12.5px] text-slate-soft">{a.id}</td>
                  <td className="px-5 py-3.5 text-[13.5px] font-medium text-ink">{a.patient}</td>
                  <td className="px-5 py-3.5 font-mono text-[12.5px] text-slate">{a.date}</td>
                  <td className="px-5 py-3.5 font-mono text-[12.5px] text-slate">{a.time}</td>
                  <td className="px-5 py-3.5 text-[13px] text-slate">{a.type}</td>
                  <td className="px-5 py-3.5"><StatusPill status={a.status} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {a.status === "Pending" && (
                        <button
                          onClick={() => handleStatusChange(a.id, "Confirmed")}
                          disabled={busyRow === a.id}
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-success-light text-success hover:bg-success hover:text-white transition-colors disabled:opacity-50"
                          title="Confirm"
                        >
                          <Check size={13} />
                        </button>
                      )}
                      {a.status === "Confirmed" && (
                        <button
                          onClick={() => handleStatusChange(a.id, "Completed")}
                          disabled={busyRow === a.id}
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-teal-light text-teal hover:bg-teal hover:text-white transition-colors disabled:opacity-50"
                          title="Mark completed"
                        >
                          <Stethoscope size={13} />
                        </button>
                      )}
                      {(a.status === "Pending" || a.status === "Confirmed") && (
                        <button
                          onClick={() => handleStatusChange(a.id, "Cancelled")}
                          disabled={busyRow === a.id}
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-danger-light text-danger hover:bg-danger hover:text-white transition-colors disabled:opacity-50"
                          title="Cancel"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rowError && <p className="mt-3 text-[12.5px] text-danger">{rowError}</p>}
      </div>
    </>
  );
}
