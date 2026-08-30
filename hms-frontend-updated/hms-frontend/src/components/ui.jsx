export function StatCard({ label, value, sub, tone = "ink", icon: Icon }) {
  const toneMap = {
    ink: "text-ink",
    teal: "text-teal",
    amber: "text-amber",
    danger: "text-danger",
  };
  return (
    <div className="bg-white rounded-xl border border-line p-5">
      <div className="flex items-start justify-between">
        <p className="text-[12px] font-medium text-slate-soft uppercase tracking-wide">{label}</p>
        {Icon && <Icon size={16} className="text-slate-soft" strokeWidth={2} />}
      </div>
      <p className={`font-display text-[28px] font-semibold mt-2 ${toneMap[tone]}`}>{value}</p>
      {sub && <p className="text-[12px] text-slate-soft mt-1">{sub}</p>}
    </div>
  );
}

export function StatusPill({ status }) {
  const map = {
    Admitted: "bg-teal-light text-teal",
    Discharged: "bg-paper-dim text-slate-soft",
    Outpatient: "bg-amber-light text-amber",
    Available: "bg-success-light text-success",
    "In Surgery": "bg-amber-light text-amber",
    "Off Duty": "bg-paper-dim text-slate-soft",
    Confirmed: "bg-success-light text-success",
    Pending: "bg-amber-light text-amber",
    Cancelled: "bg-danger-light text-danger",
    Paid: "bg-success-light text-success",
    "EMI Active": "bg-teal-light text-teal",
    "EMI Pending Approval": "bg-amber-light text-amber",
    Overdue: "bg-danger-light text-danger",
    Approved: "bg-success-light text-success",
    "Pending Approval": "bg-amber-light text-amber",
    "Pending Verification": "bg-amber-light text-amber",
    Rejected: "bg-danger-light text-danger",
    Upcoming: "bg-paper-dim text-slate-soft",
    Completed: "bg-success-light text-success",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-medium ${map[status] || "bg-paper-dim text-slate-soft"}`}>
      {status}
    </span>
  );
}

export function Card({ title, action, children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl border border-line ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-5 pt-5 pb-1">
          <h3 className="font-display text-[16px] font-semibold text-ink">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function formatNPR(amount) {
  return "Rs " + amount.toLocaleString("en-IN");
}
