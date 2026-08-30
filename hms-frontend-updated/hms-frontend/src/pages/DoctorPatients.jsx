import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FilePlus2, Search, Users } from "lucide-react";
import Topbar from "../components/Topbar";
import { StatusPill } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

export default function DoctorPatients() {
  const { user } = useAuth();
  const { patients } = useData();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [query, setQuery] = useState(routerLocation.state?.query || "");

  const trimmed = query.trim();
  const hasSearched = trimmed.length > 0;

  const results = hasSearched
    ? patients
        .filter((p) => p.doctorId === user.refId)
        .filter((p) => p.name.toLowerCase().includes(trimmed.toLowerCase()) || p.id.toLowerCase().includes(trimmed.toLowerCase()))
    : [];

  return (
    <>
      <Topbar title="My Patients" subtitle="Search by name or patient ID to pull up a record" />

      <div className="p-8">
        <div className="relative w-full max-w-md mb-6">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by patient name or ID (e.g. PT-1042)…"
            autoFocus
            className="w-full pl-10 pr-3.5 py-3 rounded-lg border border-line bg-white text-[13.5px] placeholder:text-slate-soft focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
          />
        </div>

        {!hasSearched && (
          <div className="flex flex-col items-center justify-center text-center py-20 bg-white rounded-xl border border-line border-dashed">
            <div className="w-12 h-12 rounded-full bg-teal-light flex items-center justify-center mb-3">
              <Users size={20} className="text-teal" />
            </div>
            <p className="text-[14px] font-medium text-ink">Search for a patient to get started</p>
            <p className="text-[12.5px] text-slate-soft mt-1">Type a name or patient ID above — only matching patients under your care will appear.</p>
          </div>
        )}

        {hasSearched && (
          <div className="bg-white rounded-xl border border-line overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line bg-paper-dim/40">
                  {["Patient ID", "Name", "Age / Gender", "Phone", "Last Visit", "Status", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-soft">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {results.map((p) => (
                  <tr key={p.id} className="hover:bg-paper-dim/30 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-[12.5px] text-slate-soft">{p.id}</td>
                    <td className="px-5 py-3.5 text-[13.5px] font-medium text-ink">{p.name}</td>
                    <td className="px-5 py-3.5 text-[13px] text-slate">{p.age} · {p.gender}</td>
                    <td className="px-5 py-3.5 font-mono text-[12.5px] text-slate">{p.phone}</td>
                    <td className="px-5 py-3.5 font-mono text-[12.5px] text-slate-soft">{p.lastVisit}</td>
                    <td className="px-5 py-3.5"><StatusPill status={p.status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => navigate("/doctor/reports", { state: { patientId: p.id } })}
                        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-teal hover:text-ink transition-colors"
                      >
                        <FilePlus2 size={14} /> Write report
                      </button>
                    </td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-[13px] text-slate-soft">
                      No patient under your care matches "{trimmed}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
