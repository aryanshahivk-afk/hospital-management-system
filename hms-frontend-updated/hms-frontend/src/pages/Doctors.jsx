import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Phone, CalendarClock, Search, Pencil } from "lucide-react";
import Topbar from "../components/Topbar";
import Modal from "../components/Modal";
import { StatusPill } from "../components/ui";
import { useData } from "../context/DataContext";

const SPECIALTIES = ["Cardiology", "Orthopedics", "General Medicine", "ENT"];

const emptyForm = { name: "", specialty: SPECIALTIES[0], phone: "", status: "Available" };

export default function Doctors() {
  const { doctors, addDoctor, updateDoctor } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = "add" mode, else doctor id being edited
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [query, setQuery] = useState(location.state?.query || "");

  const filtered = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(query.toLowerCase()) ||
      d.id.toLowerCase().includes(query.toLowerCase()) ||
      d.specialty.toLowerCase().includes(query.toLowerCase())
  );

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(d) {
    setEditingId(d.id);
    setForm({ name: d.name, specialty: d.specialty, phone: d.phone, status: d.status });
    setFormError("");
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    const name = form.name.trim().startsWith("Dr.") ? form.name.trim() : `Dr. ${form.name.trim()}`;
    const payload = { name, specialty: form.specialty, phone: form.phone, status: form.status };
    const result = editingId ? await updateDoctor(editingId, payload) : await addDoctor(payload);
    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setShowModal(false);
  }

  return (
    <>
      <Topbar title="Doctors" subtitle={`${doctors.length} doctors on staff`} />

      <div className="p-8">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="relative w-full max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-soft" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search doctors…"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-line bg-white text-[13px] placeholder:text-slate-soft focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
            />
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-mint text-ink border border-mint-dark/60 px-4 py-2.5 rounded-lg text-[13.5px] font-medium hover:bg-mint-dark transition-colors shrink-0"
          >
            <Plus size={15} /> Add doctor
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((d) => (
            <div key={d.id} className="bg-white rounded-xl border border-line p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-teal-light text-teal flex items-center justify-center font-semibold text-[15px]">
                    {d.name.replace("Dr. ", "").split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-ink">{d.name}</p>
                    <p className="text-[12px] text-slate-soft">{d.specialty}</p>
                  </div>
                </div>
                <StatusPill status={d.status} />
              </div>

              <div className="mt-4 pt-4 border-t border-line flex items-center justify-between text-[12.5px]">
                <span className="flex items-center gap-1.5 text-slate-soft font-mono">
                  <Phone size={12} /> {d.phone}
                </span>
                <span className="text-slate-soft">
                  <span className="font-mono text-ink font-medium">{d.patientsToday}</span> patients today
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => openEdit(d)}
                  className="flex items-center justify-center gap-1.5 text-slate text-[12.5px] font-medium py-2 rounded-lg border border-line hover:bg-paper-dim transition-colors"
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  onClick={() => navigate(`/appointments?doctor=${d.id}`)}
                  className="flex items-center justify-center gap-1.5 text-teal text-[12.5px] font-medium py-2 rounded-lg border border-teal/30 hover:bg-teal-light transition-colors"
                >
                  <CalendarClock size={13} /> Appointments
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-[13px] text-slate-soft py-10">No doctors match "{query}".</p>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? `Edit ${form.name || "doctor"}` : "Add new doctor"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {editingId && (
            <div className="bg-paper-dim/60 rounded-lg px-3.5 py-2.5 text-[12px] text-slate-soft font-mono">{editingId}</div>
          )}
          <div>
            <label className="block text-[12.5px] font-medium text-slate mb-1.5">Full name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Suman Adhikari"
              className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
            />
            <p className="text-[11px] text-slate-soft mt-1">"Dr." is added automatically if you leave it off.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] font-medium text-slate mb-1.5">Specialty</label>
              <select
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
              >
                {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12.5px] font-medium text-slate mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
              >
                <option>Available</option>
                <option>In Surgery</option>
                <option>Off Duty</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[12.5px] font-medium text-slate mb-1.5">Phone</label>
            <input
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="97X-XXX-XXXX"
              className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
            />
          </div>

          {!editingId && (
            <div className="bg-paper-dim/60 rounded-lg px-4 py-3 text-[12px] text-slate-soft">
              The new doctor can sign in from the Doctor tab on the login page (password: <span className="font-mono">doctor123</span>).
            </div>
          )}

          {formError && <p className="text-[12.5px] text-danger">{formError}</p>}

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
              className="flex-1 py-2.5 rounded-lg bg-mint text-ink border border-mint-dark/60 text-[13.5px] font-medium hover:bg-mint-dark transition-colors disabled:opacity-60"
            >
              {submitting ? (editingId ? "Saving…" : "Adding…") : editingId ? "Save changes" : "Add doctor"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
