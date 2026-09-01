import { useState, useMemo, useEffect, Fragment } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Landmark, ChevronDown, ChevronUp, Search, Minus, Receipt, FlaskConical } from "lucide-react";
import Topbar from "../components/Topbar";
import Modal from "../components/Modal";
import { StatusPill, formatNPR } from "../components/ui";
import { useData } from "../context/DataContext";

const CATEGORY_ORDER = ["Consultation", "Lab Test", "Procedure", "Room Charge"];
const PHARMACY_MAX = 50000;

export default function Billing() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { bills, patients, billingCatalog, adjustPayment, createBill, getPendingOrders, EMI_MIN, EMI_MAX } = useData();
  const [openRow, setOpenRow] = useState(null); // "<billId>:payment" or "<billId>:items"
  const [amountDrafts, setAmountDrafts] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [patientId, setPatientId] = useState("");
  // Selected catalog quantities: { [catalogItemId]: quantity }
  const [selected, setSelected] = useState({});
  const [pharmacyLines, setPharmacyLines] = useState([]); // [{ description, amount }]
  // Doctor-ordered tests waiting to be billed for the currently selected patient.
  const [pendingOrders, setPendingOrders] = useState([]);
  const [pendingOrdersLoading, setPendingOrdersLoading] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [rowError, setRowError] = useState({});
  const [rowBusy, setRowBusy] = useState(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");
  const [query, setQuery] = useState(routerLocation.state?.query || "");

  const filteredBills = bills.filter(
    (b) => !query.trim() || b.patient.toLowerCase().includes(query.toLowerCase()) || b.id.toLowerCase().includes(query.toLowerCase())
  );

  const byCategory = useMemo(() => {
    const map = {};
    for (const item of billingCatalog) {
      (map[item.category] ||= []).push(item);
    }
    return map;
  }, [billingCatalog]);

  const selectedTotal = useMemo(() => {
    let total = 0;
    for (const [id, qty] of Object.entries(selected)) {
      if (qty > 0) {
        const item = billingCatalog.find((c) => c.id === id);
        if (item) total += item.price * qty;
      }
    }
    for (const line of pharmacyLines) total += Number(line.amount) || 0;
    for (const orderId of selectedOrderIds) {
      const order = pendingOrders.find((o) => o.id === orderId);
      if (order) total += order.unitPrice;
    }
    return total;
  }, [selected, billingCatalog, pharmacyLines, selectedOrderIds, pendingOrders]);

  // Whenever the patient changes in the Create Bill modal, reload their unbilled
  // doctor-ordered tests and pre-select all of them — front desk can uncheck any that
  // shouldn't go on this particular bill.
  useEffect(() => {
    if (!showCreate || !patientId) {
      setPendingOrders([]);
      setSelectedOrderIds([]);
      return;
    }
    let cancelled = false;
    setPendingOrdersLoading(true);
    getPendingOrders(patientId).then((result) => {
      if (cancelled) return;
      setPendingOrdersLoading(false);
      if (result.ok) {
        setPendingOrders(result.data);
        setSelectedOrderIds(result.data.map((o) => o.id));
      } else {
        setPendingOrders([]);
        setSelectedOrderIds([]);
      }
    });
    return () => { cancelled = true; };
  }, [showCreate, patientId, getPendingOrders]);

  function toggleOrder(id) {
    setSelectedOrderIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function setDraft(billId, value) {
    setAmountDrafts((prev) => ({ ...prev, [billId]: value }));
  }

  async function submit(billId, direction) {
    const raw = Number(amountDrafts[billId]);
    if (!raw || raw <= 0) return;
    const bill = bills.find((b) => b.id === billId);
    if (direction === "add" && bill && bill.paid >= bill.amount) {
      setRowError((prev) => ({ ...prev, [billId]: "This bill is already fully paid." }));
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
    setPatientId(patients[0]?.id ?? "");
    setSelected({});
    setPharmacyLines([]);
    setCreateError("");
    setShowCreate(true);
  }

  function setQty(itemId, qty) {
    setSelected((prev) => ({ ...prev, [itemId]: Math.max(0, qty) }));
  }

  function addPharmacyLine() {
    setPharmacyLines((prev) => [...prev, { description: "", amount: "" }]);
  }

  function updatePharmacyLine(idx, field, value) {
    setPharmacyLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  }

  function removePharmacyLine(idx) {
    setPharmacyLines((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError("");

    const catalogItems = Object.entries(selected)
      .filter(([, qty]) => qty > 0)
      .map(([catalogItemId, quantity]) => ({ catalogItemId, quantity, description: null, amount: null }));

    const pharmacyItems = pharmacyLines
      .filter((l) => l.description.trim() && Number(l.amount) > 0)
      .map((l) => ({ catalogItemId: null, description: l.description.trim(), quantity: 1, amount: Number(l.amount) }));

    const items = [...catalogItems, ...pharmacyItems];
    if (items.length === 0 && selectedOrderIds.length === 0) {
      setCreateError("Add at least one charge — pick from the price list, a doctor's order, or add a pharmacy line.");
      return;
    }
    const overCap = pharmacyItems.find((l) => l.amount > PHARMACY_MAX);
    if (overCap) {
      setCreateError(`"${overCap.description}" exceeds the NPR ${PHARMACY_MAX.toLocaleString()} limit per pharmacy line — split it into multiple lines.`);
      return;
    }

    setCreateSubmitting(true);
    const result = await createBill({ patientId, items, orderedItemIds: selectedOrderIds });
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
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-soft" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search bills…"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-line bg-white text-[13px] placeholder:text-slate-soft focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-ink text-white px-4 py-2.5 rounded-lg text-[13.5px] font-medium hover:bg-ink-light transition-colors shrink-0"
          >
            <Plus size={15} /> Create bill
          </button>
        </div>

        <div className="bg-white rounded-xl border border-line overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-line bg-paper-dim/40">
                {["Bill ID", "Patient", "Date", "Amount", "Paid", "Status", "", "", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-soft">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredBills.map((b) => {
                const balance = b.amount - b.paid;
                const eligible = balance > 0 && b.amount >= EMI_MIN && b.amount <= EMI_MAX;
                const paymentOpen = openRow === `${b.id}:payment`;
                const itemsOpen = openRow === `${b.id}:items`;
                return (
                  <Fragment key={b.id}>
                    <tr className="hover:bg-paper-dim/30 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-[12.5px] text-slate-soft">{b.id}</td>
                      <td className="px-5 py-3.5 text-[13.5px] font-medium text-ink">{b.patient}</td>
                      <td className="px-5 py-3.5 font-mono text-[12.5px] text-slate">{b.date}</td>
                      <td className="px-5 py-3.5 font-mono text-[13px] text-ink">{formatNPR(b.amount)}</td>
                      <td className="px-5 py-3.5 font-mono text-[12.5px] text-slate-soft">{formatNPR(b.paid)}</td>
                      <td className="px-5 py-3.5"><StatusPill status={b.status} /></td>
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
                          onClick={() => setOpenRow(itemsOpen ? null : `${b.id}:items`)}
                          className="flex items-center gap-1 text-slate text-[12.5px] font-medium hover:text-ink"
                        >
                          <Receipt size={13} /> Breakdown {itemsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => setOpenRow(paymentOpen ? null : `${b.id}:payment`)}
                          className="flex items-center gap-1 text-slate text-[12.5px] font-medium hover:text-ink"
                        >
                          Payment {paymentOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>
                    </tr>
                    {itemsOpen && (
                      <tr className="bg-paper-dim/30">
                        <td colSpan={9} className="px-5 py-4">
                          {b.items?.length > 0 ? (
                            <table className="w-full text-[12.5px]">
                              <thead>
                                <tr className="text-slate-soft">
                                  <th className="text-left font-medium pb-1.5">Description</th>
                                  <th className="text-left font-medium pb-1.5">Category</th>
                                  <th className="text-right font-medium pb-1.5">Qty</th>
                                  <th className="text-right font-medium pb-1.5">Unit price</th>
                                  <th className="text-right font-medium pb-1.5">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-line/60">
                                {b.items.map((li) => (
                                  <tr key={li.id}>
                                    <td className="py-1.5 text-ink">{li.description}</td>
                                    <td className="py-1.5 text-slate-soft">{li.category}</td>
                                    <td className="py-1.5 text-right font-mono">{li.quantity}</td>
                                    <td className="py-1.5 text-right font-mono">{formatNPR(li.unitPrice)}</td>
                                    <td className="py-1.5 text-right font-mono text-ink">{formatNPR(li.amount)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-[12.5px] text-slate-soft">No itemized breakdown on file for this bill (created before itemized billing was added).</p>
                          )}
                        </td>
                      </tr>
                    )}
                    {paymentOpen && (
                      <tr className="bg-paper-dim/30">
                        <td colSpan={9} className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-[12.5px] text-slate-soft">Adjust payment for {b.id}</span>
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
                              title={balance <= 0 ? "This bill is already fully paid" : undefined}
                              className="px-3.5 py-2 rounded-lg bg-success text-white text-[12.5px] font-medium hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              + Record payment
                            </button>
                            <button
                              onClick={() => submit(b.id, "subtract")}
                              disabled={rowBusy === b.id || b.paid <= 0}
                              title={b.paid <= 0 ? "Nothing has been paid yet" : undefined}
                              className="px-3.5 py-2 rounded-lg border border-danger text-danger text-[12.5px] font-medium hover:bg-danger-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              − Refund / correct
                            </button>
                            <span className="text-[12px] text-slate-soft ml-auto font-mono">
                              {balance <= 0 ? "Fully paid" : `Balance: ${formatNPR(balance)}`}
                            </span>
                          </div>
                          {rowError[b.id] && <p className="text-[12px] text-danger mt-2">{rowError[b.id]}</p>}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {filteredBills.length === 0 && (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-[13px] text-slate-soft">No bills match "{query}".</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-[12px] text-slate-soft mt-3">
          EMI is available for outstanding balances between {formatNPR(EMI_MIN)} and {formatNPR(EMI_MAX)}.
        </p>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create new bill" width="max-w-2xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-[12.5px] font-medium text-slate mb-1.5">Patient</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
            >
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.id}</option>)}
            </select>
          </div>

          {pendingOrdersLoading && (
            <p className="text-[12px] text-slate-soft">Checking for tests the doctor ordered…</p>
          )}

          {!pendingOrdersLoading && pendingOrders.length > 0 && (
            <div className="border border-amber/30 bg-amber-light/50 rounded-lg p-3.5">
              <p className="text-[11px] font-semibold text-amber uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <FlaskConical size={12} /> Ordered by doctor — not yet billed
              </p>
              <div className="space-y-1.5">
                {pendingOrders.map((o) => (
                  <label key={o.id} className="flex items-center justify-between gap-3 text-[13px] cursor-pointer">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(o.id)}
                        onChange={() => toggleOrder(o.id)}
                        className="accent-teal"
                      />
                      {o.description}
                      <span className="text-slate-soft text-[11px]">— ordered {o.orderedOn} by {o.orderedBy}</span>
                    </span>
                    <span className="font-mono text-slate-soft">{formatNPR(o.unitPrice)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="max-h-[320px] overflow-y-auto border border-line rounded-lg divide-y divide-line">
            {CATEGORY_ORDER.filter((cat) => byCategory[cat]?.length).map((cat) => (
              <div key={cat} className="p-3.5">
                <p className="text-[11px] font-semibold text-slate-soft uppercase tracking-wide mb-2">{cat}</p>
                <div className="space-y-1.5">
                  {byCategory[cat].map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 text-[13px]">
                      <div className="flex-1 min-w-0">
                        <span className="text-ink">{item.description}</span>
                        <span className="text-slate-soft font-mono ml-2">{formatNPR(item.price)}{cat === "Room Charge" ? "/day" : ""}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setQty(item.id, (selected[item.id] || 0) - 1)}
                          className="w-6 h-6 rounded border border-line flex items-center justify-center text-slate-soft hover:bg-paper-dim disabled:opacity-40"
                          disabled={!selected[item.id]}
                        >
                          <Minus size={11} />
                        </button>
                        <span className="w-6 text-center font-mono text-[12.5px]">{selected[item.id] || 0}</span>
                        <button
                          type="button"
                          onClick={() => setQty(item.id, (selected[item.id] || 0) + 1)}
                          className="w-6 h-6 rounded border border-line flex items-center justify-center text-slate-soft hover:bg-paper-dim"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="p-3.5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold text-slate-soft uppercase tracking-wide">Pharmacy / Other (custom, capped at {formatNPR(PHARMACY_MAX)} each)</p>
                <button type="button" onClick={addPharmacyLine} className="text-[12px] text-teal font-medium hover:underline">+ Add line</button>
              </div>
              {pharmacyLines.length === 0 && <p className="text-[12px] text-slate-soft">No pharmacy/custom charges added.</p>}
              <div className="space-y-2">
                {pharmacyLines.map((line, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Paracetamol 500mg x10, Amoxicillin course"
                      value={line.description}
                      onChange={(e) => updatePharmacyLine(idx, "description", e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded border border-line bg-white text-[12.5px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                    />
                    <input
                      type="number"
                      min="1"
                      max={PHARMACY_MAX}
                      placeholder="Amount"
                      value={line.amount}
                      onChange={(e) => updatePharmacyLine(idx, "amount", e.target.value)}
                      className="w-28 px-2.5 py-1.5 rounded border border-line bg-white text-[12.5px] font-mono focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                    />
                    <button type="button" onClick={() => removePharmacyLine(idx)} className="text-slate-soft hover:text-danger text-[12px] shrink-0">Remove</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-paper-dim/60 rounded-lg px-4 py-3">
            <span className="text-[13px] text-slate">Total</span>
            <span className="font-mono font-semibold text-[16px] text-ink">{formatNPR(selectedTotal)}</span>
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
              disabled={createSubmitting || selectedTotal === 0}
              className="flex-1 py-2.5 rounded-lg bg-ink text-white text-[13.5px] font-medium hover:bg-ink-light transition-colors disabled:opacity-60"
            >
              {createSubmitting ? "Creating…" : `Create bill — ${formatNPR(selectedTotal)}`}
            </button>
          </div>
          {createError && <p className="text-[12.5px] text-danger">{createError}</p>}
        </form>
      </Modal>
    </>
  );
}
