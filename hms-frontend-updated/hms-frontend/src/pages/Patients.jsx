import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Plus, Search, X, Pencil } from "lucide-react";
import Topbar from "../components/Topbar";
import { StatusPill } from "../components/ui";
import { useData } from "../context/DataContext";

const DEPARTMENTS = ["Cardiology", "Orthopedics", "General Medicine", "ENT"];
const emptyForm = { name: "", age: "", gender: "Female", phone: "", department: DEPARTMENTS[0], doctorId: undefined };

export default function Patients() {
  const { patients, doctors, addPatient, updatePatient } = useData();
  const location = useLocation();
  const [query, setQuery] = useState(location.state?.query || "");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = "add" mode, else patient id being edited
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({ ...emptyForm, doctorId: doctors[0]?.id });

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.id.toLowerCase().includes(query.toLowerCase()) ||
      p.department.toLowerCase().includes(query.toLowerCase())
  );

  function openAdd() {
    setEditingId(null);
    setForm({ ...emptyForm, doctorId: doctors[0]?.id });
    setFormError("");
    setShowModal(true);
  }

  function openEdit(p) {
    setEditingId(p.id);
    setForm({ name: p.name, age: p.age, gender: p.gender, phone: p.phone, department: p.department, doctorId: p.doctorId || doctors[0]?.id });
    setFormError("");
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    const payload = {
      name: form.name,
      age: Number(form.age),
      gender: form.gender,
      phone: form.phone,
      department: form.department,
      doctorId: form.doctorId,
    };
    const result = editingId ? await updatePatient(editingId, payload) : await addPatient(payload);
    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setShowModal(false);
  }

  return (
    <>
      <Topbar title="Patients" subtitle={`${patients.length} registered patients`} />

      <div className="p-8">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="relative w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-soft" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, ID, or department…"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-line bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
            />
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-ink text-white px-4 py-2.5 rounded-lg text-[13.5px] font-medium hover:bg-ink-light transition-colors"
          >
            <Plus size={15} /> Register patient
          </button>
        </div>

        <div className="bg-white rounded-xl border border-line overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-line bg-paper-dim/40">
                {["Patient ID", "Name", "Age / Gender", "Phone", "Department", "Last Visit", "Status", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-soft">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-paper-dim/30 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-[12.5px] text-slate-soft">{p.id}</td>
                  <td className="px-5 py-3.5 text-[13.5px] font-medium text-ink">{p.name}</td>
                  <td className="px-5 py-3.5 text-[13px] text-slate">{p.age} · {p.gender}</td>
                  <td className="px-5 py-3.5 font-mono text-[12.5px] text-slate">{p.phone}</td>
                  <td className="px-5 py-3.5 text-[13px] text-slate">{p.department}</td>
                  <td className="px-5 py-3.5 font-mono text-[12.5px] text-slate-soft">{p.lastVisit}</td>
                  <td className="px-5 py-3.5"><StatusPill status={p.status} /></td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => openEdit(p)}
                      className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-teal hover:text-ink transition-colors"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-[13px] text-slate-soft">
                    No patients match "{query}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-semibold text-ink">{editingId ? `Edit ${form.name || "patient"}` : "Register new patient"}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-soft hover:text-ink">
                <X size={18} />
              </button>
            </div>

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
                  className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                  placeholder="e.g. Sita Gurung"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12.5px] font-medium text-slate mb-1.5">Age</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                  />
                </div>
                <div>
                  <label className="block text-[12.5px] font-medium text-slate mb-1.5">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                  >
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[12.5px] font-medium text-slate mb-1.5">Phone</label>
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                  placeholder="98X-XXX-XXXX"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12.5px] font-medium text-slate mb-1.5">Department</label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                  >
                    {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12.5px] font-medium text-slate mb-1.5">Assign doctor</label>
                  <select
                    value={form.doctorId}
                    onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                  >
                    {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
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
                  className="flex-1 py-2.5 rounded-lg bg-ink text-white text-[13.5px] font-medium hover:bg-ink-light transition-colors disabled:opacity-60"
                >
                  {submitting ? (editingId ? "Saving…" : "Registering…") : editingId ? "Save changes" : "Register patient"}
                </button>
              </div>
              {formError && <p className="text-[12.5px] text-danger">{formError}</p>}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
