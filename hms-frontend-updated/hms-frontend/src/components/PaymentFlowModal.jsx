import { useState } from "react";
import { CheckCircle2, ChevronLeft, Lock, Smartphone, Info } from "lucide-react";
import Modal from "./Modal";
import { formatNPR } from "./ui";

const METHODS = [
  { id: "eSewa", label: "eSewa", color: "#60BB46" },
  { id: "Khalti", label: "Khalti", color: "#5C2D91" },
];

// Shared method -> confirm -> mobile+PIN -> success flow. `open` controls visibility;
// `amount`/`description` describe what's being paid; `confirmSlot` is optional extra
// content shown on the confirm step (e.g. installment details table); `onPay(methodId)`
// is called only after the mobile number + PIN look valid, and should return
// { ok, error } (matches the shape every mutation in this app already returns).
// Neither the mobile number nor the PIN is ever sent anywhere — same reasoning as
// before: those are gateway-side credentials, never something a merchant site should
// see, so they're checked here only as a realistic UX gate.
export default function PaymentFlowModal({ open, onClose, amount, description, confirmSlot, onPay, onSuccess }) {
  const [step, setStep] = useState("method"); // method -> confirm -> pin -> success
  const [method, setMethod] = useState(null);
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setStep("method");
    setMethod(null);
    setMobile("");
    setPin("");
    setFieldError("");
    setBusy(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function chooseMethod(m) {
    setMethod(m);
    setStep("confirm");
  }

  function goToPin() {
    setMobile("");
    setPin("");
    setFieldError("");
    setStep("pin");
  }

  async function confirmPay() {
    if (!/^9\d{9}$/.test(mobile)) {
      setFieldError(`Enter the 10-digit mobile number linked to your ${method.label} account.`);
      return;
    }
    if (!/^\d{4,6}$/.test(pin)) {
      setFieldError(`Enter your 4-6 digit ${method.label} PIN.`);
      return;
    }
    setBusy(true);
    setFieldError("");
    const result = await onPay(method.id);
    setBusy(false);
    if (!result.ok) {
      setFieldError(result.error);
      setStep("confirm");
      return;
    }
    setStep("success");
    onSuccess?.();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={
        step === "method" ? "Choose payment method" :
        step === "confirm" ? "Confirm payment" :
        step === "pin" ? `${method?.label} checkout` :
        "Payment successful"
      }
    >
      {step === "method" && (
        <div className="space-y-3">
          <p className="text-[12.5px] text-slate-soft mb-1">
            Paying <span className="font-mono text-ink">{formatNPR(amount)}</span>{description ? ` — ${description}` : ""}
          </p>
          {METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => chooseMethod(m)}
              className="w-full flex items-center gap-3.5 border border-line rounded-lg px-4 py-3.5 hover:border-teal hover:bg-teal-light/30 transition-colors text-left"
            >
              <span className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-[13px] shrink-0" style={{ backgroundColor: m.color }}>
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

      {step === "confirm" && method && (
        <div className="space-y-4">
          <button onClick={() => setStep("method")} className="flex items-center gap-1 text-[12px] text-slate-soft hover:text-ink">
            <ChevronLeft size={13} /> Change payment method
          </button>

          <div className="flex items-center gap-2.5 bg-paper-dim/50 rounded-lg px-3.5 py-2.5">
            <span className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-[11px] shrink-0" style={{ backgroundColor: method.color }}>
              {method.label[0]}
            </span>
            <span className="text-[12.5px] text-slate">Paying with <span className="font-medium text-ink">{method.label}</span></span>
          </div>

          {confirmSlot}

          <div className="flex items-center justify-between bg-paper-dim/60 rounded-lg px-4 py-3">
            <span className="text-[13px] text-slate font-medium">Amount</span>
            <span className="font-mono font-semibold text-ink">{formatNPR(amount)}</span>
          </div>

          <div className="flex items-start gap-2 bg-teal-light/60 text-teal text-[12.5px] rounded-lg px-3.5 py-2.5">
            <Info size={14} className="shrink-0 mt-0.5" />
            Please confirm this is correct before paying — payments are recorded permanently once made.
          </div>

          {fieldError && <p className="text-[12.5px] text-danger">{fieldError}</p>}

          <button
            onClick={goToPin}
            className="w-full flex items-center justify-center gap-2 bg-teal text-white py-2.5 rounded-lg text-[13.5px] font-medium hover:bg-teal/90 transition-colors"
          >
            <CheckCircle2 size={15} />
            Confirm & pay {formatNPR(amount)}
          </button>
        </div>
      )}

      {step === "pin" && method && (
        <div className="space-y-4">
          <button onClick={() => setStep("confirm")} className="flex items-center gap-1 text-[12px] text-slate-soft hover:text-ink">
            <ChevronLeft size={13} /> Back
          </button>

          <div className="flex flex-col items-center text-center py-2">
            <span className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-[16px] mb-3" style={{ backgroundColor: method.color }}>
              {method.label[0]}
            </span>
            <p className="text-[13.5px] text-ink font-medium">Authorize this payment</p>
            <p className="text-[12px] text-slate-soft mt-1 flex items-center gap-1.5">
              <Smartphone size={12} /> {formatNPR(amount)} via {method.label}
            </p>
          </div>

          <div>
            <label className="block text-[12.5px] font-medium text-slate mb-1.5">{method.label} mobile number</label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
              placeholder="98XXXXXXXX"
              className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] font-mono focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
            />
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
              className="w-full px-3.5 py-3 rounded-lg border border-line bg-white text-[20px] tracking-[0.4em] text-center focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
            />
            {fieldError && <p className="text-[12px] text-danger mt-1.5">{fieldError}</p>}
            <p className="text-[11px] text-slate-soft mt-2">
              For your security, this is verified by {method.label} directly and is never seen by this hospital's system.
            </p>
          </div>

          <button
            onClick={confirmPay}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 bg-teal text-white py-2.5 rounded-lg text-[13.5px] font-medium hover:bg-teal/90 transition-colors disabled:opacity-60"
          >
            {busy ? "Verifying…" : `Verify & pay ${formatNPR(amount)}`}
          </button>
        </div>
      )}

      {step === "success" && method && (
        <div className="flex flex-col items-center text-center py-4 space-y-3">
          <span className="w-14 h-14 rounded-full bg-success-light text-success flex items-center justify-center">
            <CheckCircle2 size={28} />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-ink">Payment successful</p>
            <p className="text-[12.5px] text-slate-soft mt-1">
              {formatNPR(amount)}{description ? ` — ${description}` : ""} · paid via {method.label}
            </p>
          </div>
          <button onClick={handleClose} className="w-full bg-ink text-white py-2.5 rounded-lg text-[13.5px] font-medium hover:bg-ink-light transition-colors">
            Done
          </button>
        </div>
      )}
    </Modal>
  );
}
