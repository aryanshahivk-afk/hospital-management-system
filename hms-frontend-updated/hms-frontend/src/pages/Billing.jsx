import { useState, Fragment } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Landmark, ChevronDown, ChevronUp, Search } from "lucide-react";
import Topbar from "../components/Topbar";
import Modal from "../components/Modal";
import { StatusPill, formatNPR } from "../components/ui";
import { useData } from "../context/DataContext";

export default function Billing() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { bills, patients, adjustPayment, createBill, EMI_MIN, EMI_MAX } =
    useData();
  const [openRow, setOpenRow] = useState(null);
  const [amountDrafts, setAmountDrafts] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ patientId: "", amount: "" });
  const [rowError, setRowError] = useState({});
  const [rowBusy, setRowBusy] = useState(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");
  const [query, setQuery] = useState(routerLocation.state?.query || "");

  const filteredBills = bills.filter(
    (b) =>
      !query.trim() ||
      b.patient.toLowerCase().includes(query.toLowerCase()) ||
      b.id.toLowerCase().includes(query.toLowerCase()),
  );

  function setDraft(billId, value) {
    setAmountDrafts((prev) => ({ ...prev, [billId]: value }));
  }

  async function submit(billId, direction) {
    const raw = Number(amountDrafts[billId]);
    if (!raw || raw <= 0) return;
    const bill = bills.find((b) => b.id === billId);
    if (direction === "add" && bill && bill.paid >= bill.amount) {
      setRowError((prev) => ({
        ...prev,
        [billId]: "This bill is already fully paid.",
      }));
      return;
    }
    setRowBusy(billId);
    setRowError((prev) => ({ ...prev, [billId]: "" }));
    const result = await adjustPayment(billId, raw, direction);
    setRowBusy(null);
    if (!result.ok) {
      setRowError((prev) => ({ ...prev, [billId]: result.error }));
      return;
    }
    setDraft(billId, "");
  }

  function openCreate() {
    setForm({ patientId: patients[0]?.id ?? "", amount: "" });
    setCreateError("");
    setShowCreate(true);
  }

  async function handleCreate(e) {
    e.preventDefault();
    const patient = patients.find((p) => p.id === form.patientId);
    const amount = Number(form.amount);
    if (!patient || !amount || amount <= 0) return;
    setCreateSubmitting(true);
    setCreateError("");
    const result = await createBill({
      patientId: patient.id,
      patient: patient.name,
      amount,
    });
    setCreateSubmitting(false);
    if (!result.ok) {
      setCreateError(result.error);
      return;
    }
    setShowCreate(false);
  }

  return (
    <>
      <Topbar title="Billing" subtitle="Invoices and payment status" />

      <div className="p-8">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="relative w-full max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-soft"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search bills…"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-line bg-white text-[13px] placeholder:text-slate-soft focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-mint text-ink border border-mint-dark/60 px-4 py-2.5 rounded-lg text-[13.5px] font-medium hover:bg-mint-dark transition-colors shrink-0"
          >
            <Plus size={15} /> Create bill
          </button>
        </div>

        <div className="bg-white rounded-xl border border-line overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line bg-paper-dim/40">
                {[
                  "Bill ID",
                  "Patient",
                  "Date",
                  "Amount",
                  "Paid",
                  "Status",
                  "",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-soft"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredBills.map((b) => {
                const balance = b.amount - b.paid;
                const eligible =
                  balance > 0 && b.amount >= EMI_MIN && b.amount <= EMI_MAX;
                const isOpen = openRow === b.id;
                return (
                  <Fragment key={b.id}>
                    <tr className="hover:bg-paper-dim/30 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-[12.5px] text-slate-soft">
                        {b.id}
                      </td>
                      <td className="px-5 py-3.5 text-[13.5px] font-medium text-ink">
                        {b.patient}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[12.5px] text-slate">
                        {b.date}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[13px] text-ink">
                        {formatNPR(b.amount)}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[12.5px] text-slate-soft">
                        {formatNPR(b.paid)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusPill status={b.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        {eligible && (
                          <button
                            onClick={() => navigate("/emi")}
                            className="flex items-center gap-1.5 text-teal text-[12.5px] font-medium hover:underline"
                          >
                            <Landmark size={13} /> EMI
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => setOpenRow(isOpen ? null : b.id)}
                          className="flex items-center gap-1 text-slate text-[12.5px] font-medium hover:text-ink"
                        >
                          Payment{" "}
                          {isOpen ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-paper-dim/30">
                        <td colSpan={8} className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-[12.5px] text-slate-soft">
                              Adjust payment for {b.id}
                            </span>
                            <input
                              type="number"
                              min="0"
                              placeholder="Amount (Rs)"
                              value={amountDrafts[b.id] || ""}
                              onChange={(e) => setDraft(b.id, e.target.value)}
                              className="w-40 px-3 py-2 rounded-lg border border-line bg-white text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                            />
                            <button
                              onClick={() => submit(b.id, "add")}
                              disabled={rowBusy === b.id || balance <= 0}
                              title={
                                balance <= 0
                                  ? "This bill is already fully paid"
                                  : undefined
                              }
                              className="px-3.5 py-2 rounded-lg bg-success text-white text-[12.5px] font-medium hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              + Record payment
                            </button>
                            <button
                              onClick={() => submit(b.id, "subtract")}
                              disabled={rowBusy === b.id || b.paid <= 0}
                              title={
                                b.paid <= 0
                                  ? "Nothing has been paid yet"
                                  : undefined
                              }
                              className="px-3.5 py-2 rounded-lg border border-danger text-danger text-[12.5px] font-medium hover:bg-danger-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              − Refund / correct
                            </button>
                            <span className="text-[12px] text-slate-soft ml-auto font-mono">
                              {balance <= 0
                                ? "Fully paid"
                                : `Balance: ${formatNPR(balance)}`}
                            </span>
                          </div>
                          {rowError[b.id] && (
                            <p className="text-[12px] text-danger mt-2">
                              {rowError[b.id]}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {filteredBills.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-[13px] text-slate-soft"
                  >
                    No bills match "{query}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-[12px] text-slate-soft mt-3">
          EMI is available for outstanding balances between {formatNPR(EMI_MIN)}{" "}
          and {formatNPR(EMI_MAX)}.
        </p>
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create new bill"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-[12.5px] font-medium text-slate mb-1.5">
              Patient
            </label>
            <select
              value={form.patientId}
              onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12.5px] font-medium text-slate mb-1.5">
              Bill amount (Rs)
            </label>
            <input
              type="number"
              required
              min="1"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="e.g. 45000"
              className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] font-mono focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="flex-1 py-2.5 rounded-lg border border-line text-[13.5px] font-medium text-slate hover:bg-paper-dim transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSubmitting}
              className="flex-1 py-2.5 rounded-lg bg-mint text-ink border border-mint-dark/60 text-[13.5px] font-medium hover:bg-mint-dark transition-colors disabled:opacity-60"
            >
              {createSubmitting ? "Creating…" : "Create bill"}
            </button>
          </div>
          {createError && (
            <p className="text-[12.5px] text-danger">{createError}</p>
          )}
        </form>
      </Modal>
    </>
  );
}
