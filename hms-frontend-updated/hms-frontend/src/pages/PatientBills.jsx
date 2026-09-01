import { useState } from "react";
import { Landmark, Info, Upload, FileCheck2, X as XIcon } from "lucide-react";
import Topbar from "../components/Topbar";
import Modal from "../components/Modal";
import { StatusPill, formatNPR } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4MB per document

// Reads a File into a base64 string (no data: prefix) plus its content type, for
// sending straight to the backend as JSON — simplest reliable option given free-tier
// hosting doesn't guarantee a persistent uploads folder across redeploys.
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result; // "data:<type>;base64,<data>"
      const base64 = result.split(",")[1] || "";
      resolve({ base64, contentType: file.type || "application/octet-stream" });
    };
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.readAsDataURL(file);
  });
}

function DocumentUploadField({ label, hint, file, onChange, onClear }) {
  return (
    <div>
      <label className="block text-[12.5px] font-medium text-slate mb-1.5">{label}</label>
      {!file ? (
        <label className="flex items-center gap-2.5 border border-dashed border-line rounded-lg px-3.5 py-3 text-[12.5px] text-slate-soft hover:border-teal hover:text-teal cursor-pointer transition-colors">
          <Upload size={15} />
          <span>Click to upload a photo or scan (JPG, PNG, or PDF — under 4MB)</span>
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => onChange(e.target.files?.[0] || null)}
          />
        </label>
      ) : (
        <div className="flex items-center justify-between gap-2.5 border border-line rounded-lg px-3.5 py-2.5 bg-teal-light/40">
          <div className="flex items-center gap-2 min-w-0 text-[12.5px] text-ink">
            <FileCheck2 size={15} className="text-teal shrink-0" />
            <span className="truncate">{file.name}</span>
          </div>
          <button type="button" onClick={onClear} className="text-slate-soft hover:text-danger shrink-0">
            <XIcon size={15} />
          </button>
        </div>
      )}
      {hint && <p className="text-[11px] text-slate-soft mt-1">{hint}</p>}
    </div>
  );
}

export default function PatientBills() {
  const { user } = useAuth();
  const { bills, applyForEmi, emiApplications, EMI_MIN, EMI_MAX } = useData();
  const mine = bills.filter((b) => b.patientId === user.refId);

  const [activeBill, setActiveBill] = useState(null);
  const [tenure, setTenure] = useState(3);
  const [fullLegalName, setFullLegalName] = useState(user.name || "");
  const [address, setAddress] = useState("");
  const [citizenshipNumber, setCitizenshipNumber] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [idFile, setIdFile] = useState(null);
  const [incomeFile, setIncomeFile] = useState(null);
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
    setMonthlyIncome("");
    setIdFile(null);
    setIncomeFile(null);
    setApplyError("");
  }

  function handleFileSelect(setFile, file) {
    setApplyError("");
    if (file && file.size > MAX_FILE_BYTES) {
      setApplyError(`"${file.name}" is too large — please keep each document under 4MB.`);
      return;
    }
    setFile(file);
  }

  async function submitApply(e) {
    e.preventDefault();
    const balance = activeBill.amount - activeBill.paid;
    if (!fullLegalName.trim() || !address.trim() || !citizenshipNumber.trim()) {
      setApplyError("Full legal name, address, and citizenship number are all required.");
      return;
    }
    if (!monthlyIncome || Number(monthlyIncome) <= 0) {
      setApplyError("Monthly income is required — this is what your risk assessment is based on.");
      return;
    }
    if (!idFile || !incomeFile) {
      setApplyError("Please upload both your National ID and a monthly income proof document.");
      return;
    }

    setSubmitting(true);
    setApplyError("");
    try {
      const [idDoc, incomeDoc] = await Promise.all([readFileAsBase64(idFile), readFileAsBase64(incomeFile)]);

      const result = await applyForEmi({
        patientId: user.refId,
        patient: user.name,
        billId: activeBill.id,
        amount: balance,
        tenure: Number(tenure),
        fullLegalName: fullLegalName.trim(),
        address: address.trim(),
        citizenshipNumber: citizenshipNumber.trim(),
        monthlyIncome: Number(monthlyIncome),
        nationalIdDocumentBase64: idDoc.base64,
        nationalIdDocumentContentType: idDoc.contentType,
        incomeProofDocumentBase64: incomeDoc.base64,
        incomeProofDocumentContentType: incomeDoc.contentType,
      });
      if (!result.ok) {
        setApplyError(result.error);
        return;
      }
      setActiveBill(null);
    } catch (err) {
      setApplyError(err.message || "Something went wrong uploading your documents.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Topbar title="My Bills" subtitle={`${mine.length} bills on record`} />

      <div className="p-8">
        <div className="bg-white rounded-xl border border-line overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
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

      <Modal open={!!activeBill} onClose={() => setActiveBill(null)} title="Apply for an installment plan" width="max-w-lg">
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

            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label className="block text-[12.5px] font-medium text-slate mb-1.5">Monthly income (NPR)</label>
                <input
                  type="number"
                  min="1"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  placeholder="e.g. 45000"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] font-mono focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                />
              </div>
            </div>

            <DocumentUploadField
              label="National ID card (photo or scan)"
              file={idFile}
              onChange={(f) => handleFileSelect(setIdFile, f)}
              onClear={() => setIdFile(null)}
            />

            <DocumentUploadField
              label="Monthly income proof (payslip, bank statement, etc.)"
              file={incomeFile}
              onChange={(f) => handleFileSelect(setIncomeFile, f)}
              onClear={() => setIncomeFile(null)}
            />

            <div className="flex items-start gap-2 bg-amber-light text-amber text-[12.5px] rounded-lg px-3.5 py-2.5">
              <Info size={14} className="shrink-0 mt-0.5" />
              After you apply, front desk admin will verify your identity and documents before the plan is approved.
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-ink text-white py-2.5 rounded-lg text-[13.5px] font-medium hover:bg-ink-light transition-colors disabled:opacity-60"
            >
              {submitting ? "Uploading and submitting…" : "Submit application"}
            </button>
            {applyError && <p className="text-[12.5px] text-danger">{applyError}</p>}
          </form>
        )}
      </Modal>
    </>
  );
}
