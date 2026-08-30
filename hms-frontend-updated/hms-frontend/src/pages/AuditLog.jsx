import { useEffect, useState, useCallback } from "react";
import { ShieldCheck, Landmark, Receipt, CalendarClock, Users, Stethoscope, RefreshCcw } from "lucide-react";
import Topbar from "../components/Topbar";
import { Card } from "../components/ui";
import { fetchAuditLog } from "../api/data";
import { ApiError } from "../api/client";

const CATEGORY_ICON = {
  EMI: Landmark,
  Billing: Receipt,
  Appointment: CalendarClock,
  Patient: Users,
  Doctor: Stethoscope,
};

const CATEGORIES = ["All", "EMI", "Billing", "Appointment", "Patient", "Doctor"];

function timeAgo(isoTimestamp) {
  const date = new Date(isoTimestamp);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (cat) => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAuditLog(cat === "All" ? undefined : cat);
      setLogs(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load the audit log.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(category);
  }, [category, load]);

  return (
    <>
      <Topbar title="Audit Log" subtitle="A record of every consequential action, who performed it, and when" />

      <div className="p-8 space-y-4">
        <div className="bg-mint text-ink rounded-xl p-5 flex items-start gap-4 border border-mint-dark/50">
          <div className="w-10 h-10 rounded-lg bg-teal flex items-center justify-center shrink-0">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[16px] font-semibold">Why this exists</p>
            <p className="text-[13px] text-ink/70 mt-1 leading-relaxed max-w-2xl">
              Every EMI approval, payment adjustment, appointment change, and new patient/doctor
              record writes an entry here automatically — server-side, not something the UI can
              be tricked into skipping. This is what lets you answer "who approved this, and when"
              for any financial or medical decision in the system.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-medium transition-colors ${
                  category === c ? "bg-mint-dark text-ink font-semibold" : "bg-white border border-line text-slate hover:bg-paper-dim"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <button
            onClick={() => load(category)}
            className="flex items-center gap-1.5 text-[12.5px] text-teal font-medium hover:underline shrink-0"
          >
            <RefreshCcw size={13} /> Refresh
          </button>
        </div>

        <Card>
          {loading && <p className="p-6 text-center text-[13px] text-slate-soft">Loading activity…</p>}
          {!loading && error && <p className="p-6 text-center text-[13px] text-danger">{error}</p>}
          {!loading && !error && logs.length === 0 && (
            <p className="p-6 text-center text-[13px] text-slate-soft">No activity recorded yet.</p>
          )}
          {!loading && !error && logs.length > 0 && (
            <ul className="divide-y divide-line">
              {logs.map((log) => {
                const Icon = CATEGORY_ICON[log.category] || ShieldCheck;
                return (
                  <li key={log.id} className="flex items-start gap-3.5 px-5 py-3.5">
                    <span className="w-8 h-8 rounded-lg bg-teal-light text-teal flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-ink leading-snug">{log.action}</p>
                      <p className="text-[11.5px] text-slate-soft mt-0.5">
                        {log.actor} · {log.actorRole} · {timeAgo(log.timestamp)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}