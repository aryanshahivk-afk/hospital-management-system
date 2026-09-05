import { Link } from "react-router-dom";
import { Cross, UserCircle2, Stethoscope, HeartPulse, ArrowRight, Users, CalendarClock, ReceiptText } from "lucide-react";

const PORTALS = [
  {
    to: "/login/staff",
    icon: UserCircle2,
    label: "Staff Portal",
    desc: "Admin & Front Desk — patients, billing, EMI approvals",
  },
  {
    to: "/login/doctor",
    icon: Stethoscope,
    label: "Doctor Portal",
    desc: "Your patients, reports, and test orders",
  },
  {
    to: "/login/patient",
    icon: HeartPulse,
    label: "Patient Portal",
    desc: "Your records, appointments, and bills",
  },
];

export default function PortalSelect() {
  return (
    <div className="min-h-screen w-full flex bg-paper">
      <div className="hidden lg:flex lg:w-1/2 text-ink flex-col justify-between p-12 relative overflow-hidden bg-[linear-gradient(150deg,#CDEAE4_0%,#EAF4F1_35%,#FAFCFB_70%,#FFFFFF_100%)] border-r-[3px] border-teal">
        <div className="absolute -right-28 -top-28 w-[380px] h-[380px] rounded-full bg-teal/20 blur-[90px]" />
        <div className="absolute -left-16 bottom-10 w-56 h-56 rounded-full bg-amber/[0.08] blur-[90px]" />
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-[28px] bg-[linear-gradient(150deg,#0C443E_0%,#1B7A72_60%,#2FA096_100%)] opacity-90 rotate-[18deg]" />

        <div className="flex items-center gap-2.5 relative">
          <div className="w-11 h-11 rounded-2xl bg-[linear-gradient(150deg,#0C443E_0%,#1B7A72_60%,#2FA096_100%)] flex items-center justify-center shadow-lg shadow-teal/25 ring-1 ring-white/40">
            <Cross size={20} strokeWidth={2.5} className="text-white" />
          </div>
          <p className="font-semibold text-lg tracking-tight text-ink">BIC SmartCare</p>
        </div>

        <div className="relative max-w-md">
          <p className="text-[34px] leading-[1.2] font-extrabold text-ink">
            One record, from admission to the last installment.
          </p>
          <p className="text-slate text-[14.5px] mt-4 leading-relaxed">
            Patient records, appointments, and billing in one place — with EMI plans
            built in for bills patients can't pay all at once. Each portal below is
            separate, so staff, doctors, and patients each get their own dedicated
            sign-in.
          </p>

          <div className="flex flex-wrap gap-2.5 mt-7">
            {[
              { icon: Users, label: "Patient Records" },
              { icon: CalendarClock, label: "Appointments" },
              { icon: ReceiptText, label: "Billing & EMI" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-2 bg-ink/[0.04] border border-ink/[0.1] text-ink text-[12.5px] font-semibold px-3.5 py-2 rounded-full"
              >
                <Icon size={14} className="text-teal" />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-8 text-[12px] text-slate-soft font-mono">
          <span>Biratnagar International College</span>
          <span>Summer Enrichment Programme</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-lg bg-teal flex items-center justify-center text-white">
              <Cross size={18} strokeWidth={2.5} />
            </div>
            <p className="font-semibold text-lg text-ink tracking-tight">BIC SmartCare</p>
          </div>

          <h2 className="text-[22px] font-semibold text-ink">Welcome</h2>
          <p className="text-[13px] text-slate-soft mt-1.5">Choose your portal to sign in.</p>

          <div className="mt-6 space-y-3">
            {PORTALS.map((p) => {
              const Icon = p.icon;
              return (
                <Link
                  key={p.to}
                  to={p.to}
                  className="flex items-center gap-3.5 border border-line rounded-xl px-4 py-3.5 bg-white hover:border-teal hover:bg-teal-light/30 transition-colors group"
                >
                  <span className="w-11 h-11 rounded-xl bg-teal-light text-teal flex items-center justify-center shrink-0">
                    <Icon size={20} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14.5px] font-semibold text-ink">{p.label}</span>
                    <span className="block text-[12px] text-slate-soft mt-0.5">{p.desc}</span>
                  </span>
                  <ArrowRight size={16} className="text-slate-soft group-hover:text-teal group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
