import { useState, useMemo } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { Plus, Check, X, Search, Pencil } from "lucide-react";
import Topbar from "../components/Topbar";
import Modal from "../components/Modal";
import { StatusPill } from "../components/ui";
import { useData } from "../context/DataContext";

const TYPES = ["Consultation", "Follow-up", "New Patient"];

export default function Appointments() {
  const { appointments, patients, doctors, updateAppointmentStatus, createAppointment, updateAppointment } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const doctorFilter = searchParams.get("doctor");
  const routerLocation = useLocation();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = "add" mode, else appointment id being edited
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [rowError, setRowError] = useState("");
  const [busyRow, setBusyRow] = useState(null);
  const [query, setQuery] = useState(routerLocation.state?.query || "");
  const [form, setForm] = useState({
    patientId: "",
    doctorId: doctors[0]?.id ?? "",
    date: "2026-08-04",
    time: "10:00 AM",
    type: TYPES[0],
  });

  const filtered = useMemo(() => {
    let list = doctorFilter ? appointments.filter((a) => a.doctorId === doctorFilter) : appointments;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((a) => a.patient.toLowerCase().includes(q) || a.doctor.toLowerCase().includes(q) || a.id.toLowerCase().includes(q));
    }
    return list;
  }, [appointments, doctorFilter, query]);

  const filteredDoctorName = doctorFilter ? doctors.find((d) => d.id === doctorFilter)?.name : null;

  function openModal() {
    setEditingId(null);
    setForm({
      patientId: patients[0]?.id ?? "",
      doctorId: doctorFilter || doctors[0]?.id || "",
      date: "2026-08-04",
      time: "10:00 AM",
      type: TYPES[0],
    });
    setFormError("");
    setShowModal(true);
  }

  function openEdit(a) {
    setEditingId(a.id);
    setForm({ patientId: a.patientId, doctorId: a.doctorId, date: a.date, time: a.time, type: a.type });
    setFormError("");
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const doctor = doctors.find((d) => d.id === form.doctorId);
    if (!doctor) return;
    setSubmitting(true);
    setFormError("");

    let result;
    if (editingId) {
      result = await updateAppointment(editingId, {
        doctorId: doctor.id,
        date: form.date,
        time: form.time,
        type: form.type,
      });
    } else {
      const patient = patients.find((p) => p.id === form.patientId);
      if (!patient) {
        setSubmitting(false);
        return;
      }
      result = await createAppointment({
        patientId: patient.id,
        patient: patient.name,
        doctorId: doctor.id,
        doctor: doctor.name,
        date: form.date,
        time: form.time,
        type: form.type,
      });
    }

    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setShowModal(false);
  }

  async function handleStatusChange(id, status) {
    setBusyRow(id);
    setRowError("");
    const result = await updateAppointmentStatus(id, status);
    setBusyRow(null);
    if (!result.ok) setRowError(result.error);
  }

  return (
    <>
      <Topbar title="Appointments" subtitle={filteredDoctorName ? `Showing ${filteredDoctorName}'s appointments` : "Scheduling across all doctors"} />

      <div className="p-8">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {doctorFilter ? (
              <button
                onClick={() => setSearchParams({})}
                className="text-[12.5px] text-teal font-medium hover:underline shrink-0"
              >
                ← Show all doctors
              </button>
            ) : <span />}
            <div className="relative w-full max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-soft" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search appointments…"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-line bg-white text-[13px] placeholder:text-slate-soft focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
              />
            </div>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 bg-ink text-white px-4 py-2.5 rounded-lg text-[13.5px] font-medium hover:bg-ink-light transition-colors shrink-0"
          >
            <Plus size={15} /> New appointment
          </button>
        </div>

        <div className="bg-white rounded-xl border border-line overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-line bg-paper-dim/40">
                {["ID", "Patient", "Doctor", "Date", "Time", "Type", "Status", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-soft">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-paper-dim/30 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-[12.5px] text-slate-soft">{a.id}</td>
                  <td className="px-5 py-3.5 text-[13.5px] font-medium text-ink">{a.patient}</td>
                  <td className="px-5 py-3.5 text-[13px] text-slate">{a.doctor}</td>
                  <td className="px-5 py-3.5 font-mono text-[12.5px] text-slate">{a.date}</td>
                  <td className="px-5 py-3.5 font-mono text-[12.5px] text-slate">{a.time}</td>
                  <td className="px-5 py-3.5 text-[13px] text-slate">{a.type}</td>
                  <td className="px-5 py-3.5"><StatusPill status={a.status} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {a.status === "Pending" && (
                        <>
                          <button
                            onClick={() => handleStatusChange(a.id, "Confirmed")}
                            disabled={busyRow === a.id}
                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-success-light text-success hover:bg-success hover:text-white transition-colors disabled:opacity-50"
                            title="Confirm"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={() => handleStatusChange(a.id, "Cancelled")}
                            disabled={busyRow === a.id}
                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-danger-light text-danger hover:bg-danger hover:text-white transition-colors disabled:opacity-50"
                            title="Cancel"
                          >
                            <X size={13} />
                          </button>
                        </>
                      )}
                      {a.status !== "Cancelled" && a.status !== "Completed" && (
                        <button
                          onClick={() => openEdit(a)}
                          disabled={busyRow === a.id}
                          className="w-7 h-7 rounded-lg flex items-center justify-center border border-line text-slate hover:bg-paper-dim transition-colors disabled:opacity-50"
                          title="Reschedule / edit"
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-[13px] text-slate-soft">No appointments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {rowError && <p className="mt-3 text-[12.5px] text-danger">{rowError}</p>}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? `Reschedule ${editingId}` : "Schedule new appointment"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12.5px] font-medium text-slate mb-1.5">Patient</label>
            <select
              value={form.patientId}
              disabled={!!editingId}
              onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal disabled:bg-paper-dim disabled:text-slate-soft"
            >
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.id}</option>)}
            </select>
            {editingId && <p className="text-[11px] text-slate-soft mt-1">The patient on an existing appointment can't be changed — cancel and create a new one instead.</p>}
          </div>
          <div>
            <label className="block text-[12.5px] font-medium text-slate mb-1.5">Doctor</label>
            <select
              value={form.doctorId}
              onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
            >
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} · {d.specialty}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] font-medium text-slate mb-1.5">Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-medium text-slate mb-1.5">Time</label>
              <input
                required
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                placeholder="10:00 AM"
                className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
              />
            </div>
          </div>
          <div>
            <label className="block text-[12.5px] font-medium text-slate mb-1.5">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
            >
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-1">
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
              className="flex-1 py-2.5 rounded-lg bg-ink text-white text-[13.5px] font-medium hover:bg-ink-light transition-colors disabled:opacity-60"
            >
              {submitting ? (editingId ? "Saving…" : "Scheduling…") : editingId ? "Save changes" : "Schedule appointment"}
            </button>
          </div>
          {formError && <p className="text-[12.5px] text-danger">{formError}</p>}
        </form>
      </Modal>
    </>
  );
}
