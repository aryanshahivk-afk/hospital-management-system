import { FileText } from "lucide-react";
import Topbar from "../components/Topbar";
import { Card } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

export default function PatientReports() {
  const { user } = useAuth();
  const { reports } = useData();
  const mine = reports.filter((r) => r.patientId === user.refId);

  return (
    <>
      <Topbar title="Report Card" subtitle="Visit summaries and doctor notes" />

      <div className="p-8 space-y-4">
        {mine.length === 0 && (
          <Card>
            <p className="p-6 text-center text-[13px] text-slate-soft">No reports on file yet.</p>
          </Card>
        )}

        {mine.map((r) => (
          <Card key={r.id}>
            <div className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-teal-light text-teal flex items-center justify-center shrink-0">
                <FileText size={17} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <p className="text-[14.5px] font-semibold text-ink">{r.title}</p>
                  <span className="font-mono text-[11px] text-slate-soft">{r.date}</span>
                </div>
                <p className="text-[12.5px] text-slate-soft mt-0.5">{r.doctor}</p>
                <p className="text-[13px] text-slate mt-2.5 leading-relaxed">{r.summary}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
