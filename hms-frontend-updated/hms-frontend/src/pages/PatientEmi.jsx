import { useState } from "react";
import { Landmark, ShieldCheck, Info, CheckCircle2 } from "lucide-react";
import Topbar from "../components/Topbar";
import { Card, StatusPill, formatNPR } from "../components/ui";
import InstallmentLadder from "../components/InstallmentLadder";
import WorkflowStepper from "../components/WorkflowStepper";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

const STEP_FOR_STATUS = {
  "Pending Verification": 1,
  "Pending Approval": 2,
  Approved: 4,
  Rejected: 2,
};

export default function PatientEmi() {
  const { user } = useAuth();
  const { emiApplications, emiPlans, payInstallment } = useData();
  const myApps = emiApplications.filter((a) => a.patientId === user.refId);
  const [busyKey, setBusyKey] = useState(null);
  const [payError, setPayError] = useState({});
  const [confirmPay, setConfirmPay] = useState(null); // { billId, installment }

  function openConfirm(billId, installment) {
    setConfirmPay({ billId, installment });
  }

  async function handlePay() {
    if (!confirmPay) return;
    const { billId, installment } = confirmPay;
    const key = `${billId}-${installment.number}`;
    setBusyKey(key);
    setPayError((prev) => ({ ...prev, [billId]: "" }));
    const result = await payInstallment(billId, installment.number);
    setBusyKey(null);
    if (!result.ok) setPayError((prev) => ({ ...prev, [billId]: result.error }));
    else setConfirmPay(null);
  }

  return (
    <>
      <Topbar title="My EMI Plan" subtitle="Track your installment applications and payments" />

      <div className="p-8 space-y-6">
        {myApps.length === 0 && (
          <Card>
            <p className="p-6 text-center text-[13px] text-slate-soft">
              You don't have any EMI applications yet. You can apply from a bill on the "My Bills" page.
            </p>
          </Card>
        )}

        {myApps.map((app) => {
          const plan = emiPlans[app.billId];
          return (
            <Card key={app.id}>
              <div className="p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <p className="text-[16px] font-semibold text-ink">Bill {app.billId}</p>
                    <StatusPill status={app.status} />
                  </div>
                  <p className="text-[12.5px] text-slate-soft mt-1">
                    Requested {formatNPR(app.amount)} over {app.tenure} months · Applied {app.appliedOn}
                  </p>
                </div>
                {app.identityVerified && (
                  <span className="flex items-center gap-1 text-[11px] text-success font-medium">
                    <ShieldCheck size={12} /> Identity verified
                  </span>
                )}
              </div>

              <div className="px-5 pb-5 pt-1 border-t border-line">
                <WorkflowStepper currentStep={STEP_FOR_STATUS[app.status] ?? 0} />

                {app.status === "Pending Verification" && (
                  <div className="mt-4 flex items-center gap-2 bg-amber-light text-amber text-[12.5px] rounded-lg px-3.5 py-2.5">
                    <Info size={14} className="shrink-0" /> Waiting on front desk to verify your identity documents.
                  </div>
                )}

                {app.status === "Pending Approval" && (
                  <div className="mt-4 flex items-center gap-2 bg-amber-light text-amber text-[12.5px] rounded-lg px-3.5 py-2.5">
                    <Info size={14} className="shrink-0" /> Identity confirmed — waiting on admin approval.
                  </div>
                )}

                {app.status === "Rejected" && (
                  <div className="mt-4 flex items-center gap-2 bg-danger-light text-danger text-[12.5px] rounded-lg px-3.5 py-2.5">
                    <Info size={14} className="shrink-0" /> {app.rejectReason || "Application was rejected."}
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

                    {(() => {
                      const next = plan.installments.find((i) => i.status !== "Paid");
                      return next ? (
                        <div className="mt-5 flex items-center justify-between bg-paper-dim/50 rounded-lg px-4 py-3.5">
                          <p className="text-[12.5px] text-slate">
                            Next installment: <span className="font-mono text-ink">{formatNPR(next.amount)}</span> due {next.dueDate}
                          </p>
                          <button
                            onClick={() => openConfirm(app.billId, next)}
                            disabled={busyKey === `${app.billId}-${next.number}`}
                            className="flex items-center gap-1.5 bg-teal text-white text-[12.5px] font-medium px-4 py-2 rounded-lg hover:bg-teal/90 transition-colors disabled:opacity-50"
                          >
                            <Landmark size={13} />
                            {busyKey === `${app.billId}-${next.number}` ? "Processing…" : `Pay installment ${next.number}`}
                          </button>
                        </div>
                      ) : (
                        <p className="mt-5 text-[12.5px] text-success font-medium">All installments paid off. 🎉</p>
                      );
                    })()}
                    {payError[app.billId] && (
                      <p className="mt-3 text-[12.5px] text-danger">{payError[app.billId]}</p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={!!confirmPay} onClose={() => setConfirmPay(null)} title="Confirm installment payment">
        {confirmPay && (
          <div className="space-y-4">
            <div className="bg-paper-dim/60 rounded-lg px-4 py-3.5 space-y-2">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-slate-soft">Installment</span>
                <span className="font-mono text-ink">#{confirmPay.installment.number}</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-slate-soft">For month</span>
                <span className="font-mono text-ink">
                  {new Date(confirmPay.installment.dueDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-slate-soft">Due date</span>
                <span className="font-mono text-ink">{confirmPay.installment.dueDate}</span>
              </div>
              <div className="flex items-center justify-between text-[14px] pt-2 border-t border-line">
                <span className="text-slate font-medium">Amount</span>
                <span className="font-mono font-semibold text-ink">{formatNPR(confirmPay.installment.amount)}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-teal-light/60 text-teal text-[12.5px] rounded-lg px-3.5 py-2.5">
              <Info size={14} className="shrink-0 mt-0.5" />
              Please confirm this is the correct month before paying — installments are recorded permanently once paid.
            </div>

            <button
              onClick={handlePay}
              disabled={busyKey === `${confirmPay.billId}-${confirmPay.installment.number}`}
              className="w-full flex items-center justify-center gap-2 bg-teal text-white py-2.5 rounded-lg text-[13.5px] font-medium hover:bg-teal/90 transition-colors disabled:opacity-60"
            >
              <CheckCircle2 size={15} />
              {busyKey === `${confirmPay.billId}-${confirmPay.installment.number}`
                ? "Processing…"
                : `Confirm & pay ${formatNPR(confirmPay.installment.amount)}`}
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
