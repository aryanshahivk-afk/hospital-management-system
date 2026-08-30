import { Check } from "lucide-react";
import { formatNPR } from "./ui";

// The signature visual for EMI Management: a horizontal ladder of rungs,
// one per installment, that fills in amber as payments clear. It reads
// like a physical payment plan you can see progress climb across.
export default function InstallmentLadder({ installments, monthlyAmount }) {
  if (!installments || installments.length === 0) return null;

  const paidCount = installments.filter((i) => i.status === "Paid").length;

  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-[12px] text-slate-soft uppercase tracking-wide font-medium">Installment progress</p>
          <p className="font-mono text-[13px] text-ink mt-1">
            {paidCount} of {installments.length} paid · {formatNPR(monthlyAmount)}/mo
          </p>
        </div>
      </div>

      <div className="relative flex items-stretch gap-0">
        {installments.map((inst, idx) => {
          const isPaid = inst.status === "Paid";
          const isLast = idx === installments.length - 1;
          return (
            <div key={inst.number} className="flex-1 flex items-center">
              <div className="flex flex-col items-center gap-2 w-full">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors ${
                    isPaid
                      ? "bg-amber border-amber text-white"
                      : "bg-white border-line text-slate-soft"
                  }`}
                >
                  {isPaid ? <Check size={15} strokeWidth={3} /> : (
                    <span className="text-[12px] font-mono font-medium">{inst.number}</span>
                  )}
                </div>
                <div className="text-center leading-tight">
                  <p className="text-[10.5px] font-mono text-slate-soft">{inst.dueDate}</p>
                </div>
              </div>
              {!isLast && (
                <div className={`h-0.5 flex-1 -mx-1 mb-6 ${isPaid ? "bg-amber" : "bg-line"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
