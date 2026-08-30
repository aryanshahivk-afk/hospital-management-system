import { Check } from "lucide-react";

const STEPS = ["Applied", "Identity Verification", "Admin Approval", "Installment Plan", "Payment Tracking"];

// currentStep is 0-indexed: how many steps are complete
export default function WorkflowStepper({ currentStep }) {
  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-medium shrink-0 ${
                  done
                    ? "bg-teal text-white"
                    : active
                    ? "bg-amber text-white"
                    : "bg-paper-dim text-slate-soft"
                }`}
              >
                {done ? <Check size={11} strokeWidth={3} /> : i + 1}
              </div>
              <span className={`text-[10.5px] text-center leading-tight max-w-[70px] ${active ? "text-ink font-medium" : "text-slate-soft"}`}>
                {step}
              </span>
            </div>
            {!isLast && <div className={`h-0.5 flex-1 mx-1 mb-4 ${done ? "bg-teal" : "bg-line"}`} />}
          </div>
        );
      })}
    </div>
  );
}
