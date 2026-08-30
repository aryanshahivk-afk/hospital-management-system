import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FileText, FilePlus2 } from "lucide-react";
import Topbar from "../components/Topbar";
import Modal from "../components/Modal";
import { Card } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

export default function DoctorReports() {
  const { user } = useAuth();
  const { patients, reports, addReport } = useData();
  const location = useLocation();

  const myPatients = patients.filter((p) => p.doctorId === user.refId);
  const myReports = reports
    .filter((r) => r.doctorId === user.refId || r.doctor === user.name)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    patientId: location.state?.patientId || myPatients[0]?.id || "",
    title: "",
    summary: "",
  });
  const [justSent, setJustSent] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Arrived here via "Write report" on a specific patient — jump straight into the form.
  useEffect(() => {
    if (location.state?.patientId) {
      setForm((f) => ({ ...f, patientId: location.state.patientId }));
      setShowModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.patientId]);

  function openModal() {
    setForm({ patientId: location.state?.patientId || myPatients[0]?.id || "", title: "", summary: "" });
    setFormError("");
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const patient = myPatients.find((p) => p.id === form.patientId);
    if (!patient) return;
    setSubmitting(true);
    setFormError("");
    const result = await addReport({
      patientId: patient.id,
      patient: patient.name,
      doctorId: user.refId,
      doctor: user.name,
      title: form.title,
      summary: form.summary,
    });
    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setShowModal(false);
    setJustSent(patient.name);
    setTimeout(() => setJustSent(null), 3500);
  }

  return (
    <>
      <Topbar title="Patient Reports" subtitle="Write and send visit reports to your patients" />

      <div className="p-8 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-slate-soft">
            {myReports.length} report{myReports.length !== 1 ? "s" : ""} sent
          </p>
          <button
            onClick={openModal}
            disabled={myPatients.length === 0}
            className="flex items-center gap-2 bg-mint text-ink border border-mint-dark/60 px-4 py-2.5 rounded-lg text-[13.5px] font-medium hover:bg-mint-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FilePlus2 size={15} /> Write report
          </button>
        </div>

        {justSent && (
          <div className="rounded-lg bg-success-light text-success text-[13px] px-4 py-2.5 border border-success/20">
            Report sent to {justSent} — they can now view it in their patient portal.
          </div>
        )}

        {myReports.length === 0 && (
          <Card>
            <p className="p-6 text-center text-[13px] text-slate-soft">
              You haven't written any reports yet. Click "Write report" to send your first one.
            </p>
          </Card>
        )}

        {myReports.map((r) => (
          <Card key={r.id}>
            <div className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-teal-light text-teal flex items-center justify-center shrink-0">
                <FileText size={17} />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <p className="text-[14.5px] font-semibold text-ink">{r.title}</p>
                  <span className="font-mono text-[11px] text-slate-soft">{r.date}</span>
                </div>
                <p className="text-[12.5px] text-slate-soft mt-0.5">
                  {r.patient} · {r.patientId}
                </p>
                <p className="text-[13px] text-slate mt-2.5 leading-relaxed">{r.summary}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Write patient report">
        {myPatients.length === 0 ? (
          <p className="text-[13px] text-slate-soft">You have no patients assigned yet.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12.5px] font-medium text-slate mb-1.5">Patient</label>
              <select
                required
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
              >
                {myPatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12.5px] font-medium text-slate mb-1.5">Report title</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Follow-up consultation"
                className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-medium text-slate mb-1.5">Summary / notes</label>
              <textarea
                required
                rows={5}
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="Findings, diagnosis, advice, next steps…"
                className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-line text-[13.5px] font-medium text-slate hover:bg-paper-dim transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-lg bg-mint text-ink border border-mint-dark/60 text-[13.5px] font-medium hover:bg-mint-dark transition-colors disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Send to patient"}
              </button>
            </div>
            {formError && <p className="text-[12.5px] text-danger">{formError}</p>}
          </form>
        )}
      </Modal>
    </>
  );
}
