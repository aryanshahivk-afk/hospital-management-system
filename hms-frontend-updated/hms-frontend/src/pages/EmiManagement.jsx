import { useState } from "react";
import { Landmark, Info, ShieldCheck, Check, X, AlertTriangle, Clock } from "lucide-react";
import Topbar from "../components/Topbar";
import { Card, StatusPill, formatNPR } from "../components/ui";
import InstallmentLadder from "../components/InstallmentLadder";
import WorkflowStepper from "../components/WorkflowStepper";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

const STEP_FOR_STATUS = {
  "Pending Verification": 1,
  "Pending Approval": 2,
  Approved: 4,
  Rejected: 2,
};

const RISK_STYLES = {
  Low: "bg-success-light text-success",
  Medium: "bg-amber-light text-amber",
  High: "bg-danger-light text-danger",
};

function RiskBadge({ band, score }) {
  if (!band || band === "N/A") return null;
  return (
    <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${RISK_STYLES[band] || "bg-paper-dim text-slate"}`}>
      <AlertTriangle size={11} /> {band} risk · {score}/100
    </span>
  );
}

export default function EmiManagement() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const { emiApplications, emiPlans, bills, verifyIdentity, approveEmi, rejectEmi, EMI_MIN, EMI_MAX } = useData();
  const [downPaymentDrafts, setDownPaymentDrafts] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [rowErrors, setRowErrors] = useState({});

  function billFor(app) {
    return bills.find((b) => b.id === app.billId);
  }

  async function handleVerify(app) {
    setBusyId(app.id);
    setRowErrors((prev) => ({ ...prev, [app.id]: "" }));
    const result = await verifyIdentity(app.id);
    setBusyId(null);
    if (!result.ok) setRowErrors((prev) => ({ ...prev, [app.id]: result.error }));
  }

  async function handleApprove(app) {
    const downPayment = Number(downPaymentDrafts[app.id] || 0);
    setBusyId(app.id);
    setRowErrors((prev) => ({ ...prev, [app.id]: "" }));
    const result = await approveEmi(app.id, { downPayment });
    setBusyId(null);
    if (!result.ok) setRowErrors((prev) => ({ ...prev, [app.id]: result.error }));
  }

  async function handleReject(app) {
    setBusyId(app.id);
    setRowErrors((prev) => ({ ...prev, [app.id]: "" }));
    const result = await rejectEmi(app.id, "Application did not meet approval criteria");
    setBusyId(null);
    if (!result.ok) setRowErrors((prev) => ({ ...prev, [app.id]: result.error }));
  }

  const sorted = [...emiApplications].sort((a, b) => (a.status === "Approved" ? 1 : -1));

  return (
    <>
      <Topbar title="EMI Management" subtitle="Installment plans for patients who can't pay in full" />

      <div className="p-8 space-y-6">
        <div className="bg-mint text-ink rounded-xl p-5 flex items-start gap-4 border border-mint-dark/50">
          <div className="w-10 h-10 rounded-lg bg-amber flex items-center justify-center shrink-0">
            <Landmark size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[16px] font-semibold">How EMI approval works</p>
            <p className="text-[13px] text-ink/70 mt-1 leading-relaxed max-w-2xl">
              A patient applies for an installment plan from their portal. Front desk
              verifies their identity against the citizenship card, then an administrator
              reviews and approves or rejects the application. Once approved, the balance
              splits into monthly installments that are tracked automatically. Available
              only for bills between{" "}
              <span className="font-mono text-ink font-semibold">{formatNPR(EMI_MIN)}</span> and{" "}
              <span className="font-mono text-ink font-semibold">{formatNPR(EMI_MAX)}</span>.
            </p>
          </div>
        </div>

        {sorted.map((app) => {
          const bill = billFor(app);
          const plan = emiPlans[app.billId];
          return (
            <Card key={app.id}>
              <div className="p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <p className="text-[16px] font-semibold text-ink">{app.patient}</p>
                    <StatusPill status={app.status} />
                    <RiskBadge band={app.riskBand} score={app.riskScore} />
                    {app.identityVerified && (
                      <span className="flex items-center gap-1 text-[11px] text-success font-medium">
                        <ShieldCheck size={12} /> Identity verified
                      </span>
                    )}
                  </div>
                  <p className="text-[12.5px] text-slate-soft mt-1">
                    Bill {app.billId} · Requested {formatNPR(app.amount)} over {app.tenure} months · Applied {app.appliedOn}
                    {bill && <> · Balance due {formatNPR(bill.amount - bill.paid)}</>}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-1 border-t border-line">
                <WorkflowStepper currentStep={STEP_FOR_STATUS[app.status] ?? 0} />

                {app.status === "Pending Verification" && (
                  <div className="mt-4 space-y-3">
                    <div className="bg-white border border-line rounded-lg px-4 py-3.5">
                      <p className="text-[11px] font-semibold text-slate-soft uppercase tracking-wide mb-2.5">Submitted ID details — check against physical documents</p>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-[10.5px] text-slate-soft uppercase tracking-wide">Full legal name</p>
                          <p className="text-[13px] text-ink mt-0.5">{app.fullLegalName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10.5px] text-slate-soft uppercase tracking-wide">Address</p>
                          <p className="text-[13px] text-ink mt-0.5">{app.address || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10.5px] text-slate-soft uppercase tracking-wide">Citizenship no.</p>
                          <p className="text-[13px] text-ink font-mono mt-0.5">{app.citizenshipNumber || "—"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-amber-light rounded-lg px-4 py-3">
                      <p className="flex items-center gap-2 text-[12.5px] text-amber">
                        <Info size={14} /> Confirm these match the patient's citizenship card before verifying.
                      </p>
                      <button
                        onClick={() => handleVerify(app)}
                        disabled={busyId === app.id}
                        className="flex items-center gap-1.5 bg-teal text-white text-[12.5px] font-medium px-3.5 py-2 rounded-lg hover:bg-teal/90 transition-colors shrink-0 disabled:opacity-50"
                      >
                        <ShieldCheck size={14} /> Verify identity
                      </button>
                    </div>
                  </div>
                )}

                {app.status === "Pending Approval" && !isAdmin && (
                  <div className="mt-4 flex items-center gap-2.5 bg-paper-dim/50 rounded-lg px-4 py-3.5">
                    <Clock size={15} className="text-slate-soft shrink-0" />
                    <p className="text-[12.5px] text-slate">
                      Identity confirmed — this application is now with an administrator for the final approval decision.
                    </p>
                  </div>
                )}

                {app.status === "Pending Approval" && isAdmin && (
                  <div className="mt-4 bg-paper-dim/50 rounded-lg px-4 py-3.5">
                    <p className="text-[12.5px] text-slate mb-3">
                      Identity confirmed. Set a down payment (optional) and approve, or reject the application.
                    </p>

                    {app.riskBand && app.riskBand !== "N/A" && (
                      <div className="mb-3 bg-white border border-line rounded-lg px-3.5 py-3">
                        <p className="text-[11.5px] font-semibold text-ink mb-1.5">Risk assessment</p>
                        <ul className="space-y-1">
                          {app.riskReasons?.map((r, i) => (
                            <li key={i} className="text-[12px] text-slate-soft flex gap-1.5">
                              <span className="shrink-0">·</span> {r}
                            </li>
                          ))}
                        </ul>
                        {app.suggestedTenureMonths && app.suggestedTenureMonths !== app.tenure && (
                          <p className="text-[12px] text-teal mt-2">
                            Suggestion: {app.suggestedTenureMonths}-month tenure would bring this closer to a comfortable monthly installment.
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        placeholder="Down payment (Rs)"
                        value={downPaymentDrafts[app.id] || ""}
                        onChange={(e) => setDownPaymentDrafts((prev) => ({ ...prev, [app.id]: e.target.value }))}
                        className="w-44 px-3 py-2 rounded-lg border border-line bg-white text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                      />
                      <button
                        onClick={() => handleApprove(app)}
                        disabled={busyId === app.id}
                        className="flex items-center gap-1.5 bg-success text-white text-[12.5px] font-medium px-3.5 py-2 rounded-lg hover:bg-success/90 transition-colors disabled:opacity-50"
                      >
                        <Check size={14} /> Approve plan
                      </button>
                      <button
                        onClick={() => handleReject(app)}
                        disabled={busyId === app.id}
                        className="flex items-center gap-1.5 border border-danger text-danger text-[12.5px] font-medium px-3.5 py-2 rounded-lg hover:bg-danger-light transition-colors disabled:opacity-50"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </div>
                )}

                {app.status === "Approved" && plan && (
                  <div className="mt-5">
                    <div className="grid grid-cols-4 gap-4 mb-5">
                      <div>
                        <p className="text-[11px] text-slate-soft uppercase tracking-wide">Total bill</p>
                        <p className="font-mono text-[14px] text-ink mt-0.5">{formatNPR(plan.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-soft uppercase tracking-wide">Down payment</p>
                        <p className="font-mono text-[14px] text-ink mt-0.5">{formatNPR(plan.downPayment)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-soft uppercase tracking-wide">Tenure</p>
                        <p className="font-mono text-[14px] text-ink mt-0.5">{plan.tenureMonths} months</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-soft uppercase tracking-wide">Monthly installment</p>
                        <p className="font-mono text-[14px] text-ink mt-0.5">{formatNPR(plan.monthlyAmount)}</p>
                      </div>
                    </div>
                    <InstallmentLadder installments={plan.installments} monthlyAmount={plan.monthlyAmount} />
                  </div>
                )}

                {app.status === "Rejected" && (
                  <div className="mt-4 flex items-center gap-2 bg-danger-light text-danger text-[12.5px] rounded-lg px-3.5 py-2.5">
                    <Info size={14} className="shrink-0" /> {app.rejectReason || "Application rejected."}
                  </div>
                )}
                {rowErrors[app.id] && (
                  <p className="mt-3 text-[12.5px] text-danger">{rowErrors[app.id]}</p>
                )}
              </div>
            </Card>
          );
        })}

        {sorted.length === 0 && (
          <Card>
            <p className="p-6 text-center text-[13px] text-slate-soft">No EMI applications yet.</p>
          </Card>
        )}
      </div>
    </>
  );
}