import { useState } from "react";
import { Landmark, Info } from "lucide-react";
import Topbar from "../components/Topbar";
import Modal from "../components/Modal";
import { StatusPill, formatNPR } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

export default function PatientBills() {
  const { user } = useAuth();
  const { bills, applyForEmi, emiApplications, EMI_MIN, EMI_MAX } = useData();
  const mine = bills.filter((b) => b.patientId === user.refId);

  const [activeBill, setActiveBill] = useState(null);
  const [tenure, setTenure] = useState(3);
  const [fullLegalName, setFullLegalName] = useState(user.name || "");
  const [address, setAddress] = useState("");
  const [citizenshipNumber, setCitizenshipNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [applyError, setApplyError] = useState("");

  function alreadyApplied(billId) {
    return emiApplications.some((a) => a.billId === billId && a.status !== "Rejected");
  }

  function openApply(bill) {
    setActiveBill(bill);
    setTenure(3);
    setFullLegalName(user.name || "");
    setAddress("");
    setCitizenshipNumber("");
    setApplyError("");
  }

  async function submitApply(e) {
    e.preventDefault();
    const balance = activeBill.amount - activeBill.paid;
    if (!fullLegalName.trim() || !address.trim() || !citizenshipNumber.trim()) {
      setApplyError("Full legal name, address, and citizenship number are all required.");
      return;
    }
    setSubmitting(true);
    setApplyError("");
    const result = await applyForEmi({
      patientId: user.refId,
      patient: user.name,
      billId: activeBill.id,
      amount: balance,
      tenure: Number(tenure),
      fullLegalName: fullLegalName.trim(),
      address: address.trim(),
      citizenshipNumber: citizenshipNumber.trim(),
    });
    setSubmitting(false);
    if (!result.ok) {
      setApplyError(result.error);
      return;
    }
    setActiveBill(null);
  }

  return (
    <>
      <Topbar title="My Bills" subtitle={`${mine.length} bills on record`} />

      <div className="p-8">
        <div className="bg-white rounded-xl border border-line overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line bg-paper-dim/40">
                {["Bill ID", "Date", "Amount", "Paid", "Balance", "Status", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-soft">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {mine.map((b) => {
                const balance = b.amount - b.paid;
                const eligible = balance >= EMI_MIN && balance <= EMI_MAX;
                const applied = alreadyApplied(b.id);
                return (
                  <tr key={b.id} className="hover:bg-paper-dim/30 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-[12.5px] text-slate-soft">{b.id}</td>
                    <td className="px-5 py-3.5 font-mono text-[12.5px] text-slate">{b.date}</td>
                    <td className="px-5 py-3.5 font-mono text-[13px] text-ink">{formatNPR(b.amount)}</td>
                    <td className="px-5 py-3.5 font-mono text-[12.5px] text-slate-soft">{formatNPR(b.paid)}</td>
                    <td className="px-5 py-3.5 font-mono text-[13px] text-ink">{formatNPR(balance)}</td>
                    <td className="px-5 py-3.5"><StatusPill status={b.status} /></td>
                    <td className="px-5 py-3.5">
                      {balance > 0 && eligible && !applied && (
                        <button
                          onClick={() => openApply(b)}
                          className="flex items-center gap-1.5 text-teal text-[12.5px] font-medium hover:underline"
                        >
                          <Landmark size={13} /> Apply for EMI
                        </button>
                      )}
                      {applied && <span className="text-[12px] text-slate-soft">Application in progress</span>}
                    </td>
                  </tr>
                );
              })}
              {mine.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-[13px] text-slate-soft">No bills on record.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-[12px] text-slate-soft mt-3">
          EMI is available for outstanding balances between {formatNPR(EMI_MIN)} and {formatNPR(EMI_MAX)}.
        </p>
      </div>

      <Modal open={!!activeBill} onClose={() => setActiveBill(null)} title="Apply for an installment plan">
        {activeBill && (
          <form onSubmit={submitApply} className="space-y-4">
            <div className="bg-paper-dim/60 rounded-lg px-4 py-3 text-[12.5px] text-slate">
              Bill <span className="font-mono">{activeBill.id}</span> · Outstanding balance{" "}
              <span className="font-mono font-medium text-ink">{formatNPR(activeBill.amount - activeBill.paid)}</span>
            </div>

            <div>
              <label className="block text-[12.5px] font-medium text-slate mb-1.5">Repayment tenure</label>
              <select
                value={tenure}
                onChange={(e) => setTenure(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
              >
                {[3, 4, 5, 6, 9, 12].map((m) => (
                  <option key={m} value={m}>{m} months</option>
                ))}
              </select>
              <p className="text-[11.5px] text-slate-soft mt-1.5 font-mono">
                ≈ {formatNPR(Math.round((activeBill.amount - activeBill.paid) / tenure))} / month
              </p>
            </div>

            <div>
              <label className="block text-[12.5px] font-medium text-slate mb-1.5">Full legal name (as on citizenship)</label>
              <input
                type="text"
                value={fullLegalName}
                onChange={(e) => setFullLegalName(e.target.value)}
                placeholder="e.g. Bikash Thapa"
                className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-medium text-slate mb-1.5">Permanent address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Ward 9, Biratnagar, Morang"
                className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-medium text-slate mb-1.5">Citizenship number</label>
              <input
                type="text"
                value={citizenshipNumber}
                onChange={(e) => setCitizenshipNumber(e.target.value)}
                placeholder="e.g. 23-01-69-08834"
                className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] font-mono focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
              />
            </div>

            <div className="flex items-start gap-2 bg-amber-light text-amber text-[12.5px] rounded-lg px-3.5 py-2.5">
              <Info size={14} className="shrink-0 mt-0.5" />
              After you apply, front desk admin will verify your identity before the plan is approved.
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-mint text-ink border border-mint-dark/60 py-2.5 rounded-lg text-[13.5px] font-medium hover:bg-mint-dark transition-colors disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit application"}
            </button>
            {applyError && <p className="text-[12.5px] text-danger">{applyError}</p>}
          </form>
        )}
      </Modal>
    </>
  );
}
