import { useState } from "react";
import { Landmark, ShieldCheck, Info, CheckCircle2, ChevronLeft, Lock, Smartphone } from "lucide-react";
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

const METHODS = [
  { id: "eSewa", label: "eSewa", color: "#60BB46", textColor: "#0B5D1E" },
  { id: "Khalti", label: "Khalti", color: "#5C2D91", textColor: "#5C2D91" },
];

export default function PatientEmi() {
  const { user } = useAuth();
  const { emiApplications, emiPlans, payInstallment } = useData();
  const myApps = emiApplications.filter((a) => a.patientId === user.refId);
  const [busyKey, setBusyKey] = useState(null);
  const [payError, setPayError] = useState({});

  // Flow: null -> "method" -> "confirm" -> "pin" -> "success"
  const [flow, setFlow] = useState(null);
  const [payTarget, setPayTarget] = useState(null); // { billId, installment }
  const [method, setMethod] = useState(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  function openPay(billId, installment) {
    setPayTarget({ billId, installment });
    setMethod(null);
    setPin("");
    setPinError("");
    setFlow("method");
  }

  function closeFlow() {
    setFlow(null);
    setPayTarget(null);
  }

  function chooseMethod(m) {
    setMethod(m);
    setFlow("confirm");
  }

  function goToPin() {
    setPin("");
    setPinError("");
    setFlow("pin");
  }

  // The PIN is checked here, on the device, and never sent anywhere — exactly like a
  // real eSewa/Khalti checkout, where the wallet app (not the merchant) verifies your
  // PIN. This app has no real gateway behind it, so this step just confirms the PIN
  // looks like a real one (4-6 digits) before "authorizing" the payment call below.
  async function confirmPin() {
    if (!/^\d{4,6}$/.test(pin)) {
      setPinError("Enter your 4-6 digit " + method.label + " PIN.");
      return;
    }
    const { billId, installment } = payTarget;
    const key = `${billId}-${installment.number}`;
    setBusyKey(key);
    setPinError("");
    const result = await payInstallment(billId, installment.number, method.id);
    setBusyKey(null);
    if (!result.ok) {
      setPayError((prev) => ({ ...prev, [billId]: result.error }));
      closeFlow();
      return;
    }
    setFlow("success");
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
                            onClick={() => openPay(app.billId, next)}
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

      <Modal
        open={!!flow}
        onClose={closeFlow}
        title={
          flow === "method" ? "Choose payment method" :
          flow === "confirm" ? "Confirm installment payment" :
          flow === "pin" ? `Enter your ${method?.label} PIN` :
          "Payment successful"
        }
      >
        {flow === "method" && payTarget && (
          <div className="space-y-3">
            <p className="text-[12.5px] text-slate-soft mb-1">
              Paying <span className="font-mono text-ink">{formatNPR(payTarget.installment.amount)}</span> for installment #{payTarget.installment.number}
            </p>
            {METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => chooseMethod(m)}
                className="w-full flex items-center gap-3.5 border border-line rounded-lg px-4 py-3.5 hover:border-teal hover:bg-teal-light/30 transition-colors text-left"
              >
                <span
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-[13px] shrink-0"
                  style={{ backgroundColor: m.color }}
                >
                  {m.label[0]}
                </span>
                <span>
                  <span className="block text-[14px] font-medium text-ink">{m.label}</span>
                  <span className="block text-[11.5px] text-slate-soft">Pay with your {m.label} wallet</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {flow === "confirm" && payTarget && method && (
          <div className="space-y-4">
            <button
              onClick={() => setFlow("method")}
              className="flex items-center gap-1 text-[12px] text-slate-soft hover:text-ink"
            >
              <ChevronLeft size={13} /> Change payment method
            </button>

            <div className="flex items-center gap-2.5 bg-paper-dim/50 rounded-lg px-3.5 py-2.5">
              <span
                className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-[11px] shrink-0"
                style={{ backgroundColor: method.color }}
              >
                {method.label[0]}
              </span>
              <span className="text-[12.5px] text-slate">Paying with <span className="font-medium text-ink">{method.label}</span></span>
            </div>

            <div className="bg-paper-dim/60 rounded-lg px-4 py-3.5 space-y-2">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-slate-soft">Installment</span>
                <span className="font-mono text-ink">#{payTarget.installment.number}</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-slate-soft">For month</span>
                <span className="font-mono text-ink">
                  {new Date(payTarget.installment.dueDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-slate-soft">Due date</span>
                <span className="font-mono text-ink">{payTarget.installment.dueDate}</span>
              </div>
              <div className="flex items-center justify-between text-[14px] pt-2 border-t border-line">
                <span className="text-slate font-medium">Amount</span>
                <span className="font-mono font-semibold text-ink">{formatNPR(payTarget.installment.amount)}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-teal-light/60 text-teal text-[12.5px] rounded-lg px-3.5 py-2.5">
              <Info size={14} className="shrink-0 mt-0.5" />
              Please confirm this is the correct month before paying — installments are recorded permanently once paid.
            </div>

            <button
              onClick={goToPin}
              className="w-full flex items-center justify-center gap-2 bg-teal text-white py-2.5 rounded-lg text-[13.5px] font-medium hover:bg-teal/90 transition-colors"
            >
              <CheckCircle2 size={15} />
              Confirm & pay {formatNPR(payTarget.installment.amount)}
            </button>
          </div>
        )}

        {flow === "pin" && payTarget && method && (
          <div className="space-y-4">
            <button
              onClick={() => setFlow("confirm")}
              className="flex items-center gap-1 text-[12px] text-slate-soft hover:text-ink"
            >
              <ChevronLeft size={13} /> Back
            </button>

            <div className="flex flex-col items-center text-center py-2">
              <span
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-[16px] mb-3"
                style={{ backgroundColor: method.color }}
              >
                {method.label[0]}
              </span>
              <p className="text-[13.5px] text-ink font-medium">Authorize this payment</p>
              <p className="text-[12px] text-slate-soft mt-1 flex items-center gap-1.5">
                <Smartphone size={12} /> {formatNPR(payTarget.installment.amount)} via {method.label}
              </p>
            </div>

            <div>
              <label className="block text-[12.5px] font-medium text-slate mb-1.5 flex items-center gap-1.5">
                <Lock size={12} /> {method.label} PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                autoFocus
                className="w-full px-3.5 py-3 rounded-lg border border-line bg-white text-[20px] tracking-[0.4em] text-center focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
              />
              {pinError && <p className="text-[12px] text-danger mt-1.5">{pinError}</p>}
              <p className="text-[11px] text-slate-soft mt-2">
                For your security, your PIN is verified by {method.label} directly and is never seen by this hospital's system.
              </p>
            </div>

            <button
              onClick={confirmPin}
              disabled={busyKey === `${payTarget.billId}-${payTarget.installment.number}`}
              className="w-full flex items-center justify-center gap-2 bg-teal text-white py-2.5 rounded-lg text-[13.5px] font-medium hover:bg-teal/90 transition-colors disabled:opacity-60"
            >
              {busyKey === `${payTarget.billId}-${payTarget.installment.number}` ? "Verifying…" : `Verify & pay ${formatNPR(payTarget.installment.amount)}`}
            </button>
          </div>
        )}

        {flow === "success" && payTarget && method && (
          <div className="flex flex-col items-center text-center py-4 space-y-3">
            <span className="w-14 h-14 rounded-full bg-success-light text-success flex items-center justify-center">
              <CheckCircle2 size={28} />
            </span>
            <div>
              <p className="text-[15px] font-semibold text-ink">Payment successful</p>
              <p className="text-[12.5px] text-slate-soft mt-1">
                Installment #{payTarget.installment.number} · {formatNPR(payTarget.installment.amount)} · paid via {method.label}
              </p>
            </div>
            <button
              onClick={closeFlow}
              className="w-full bg-ink text-white py-2.5 rounded-lg text-[13.5px] font-medium hover:bg-ink-light transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
