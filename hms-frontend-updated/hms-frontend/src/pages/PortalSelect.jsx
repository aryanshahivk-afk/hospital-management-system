import { Link } from "react-router-dom";
import {
  Cross,
  UserCircle2,
  Stethoscope,
  Heart,
  ArrowRight,
} from "lucide-react";

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
    icon: Heart,
    label: "Patient Portal",
    desc: "Your records, appointments, and bills",
  },
];

// Single centered layout instead of a split-screen hero — this stays visually rich
// (logo, soft decorative color, tagline) at every window width instead of going bare
// the moment the screen drops below a "wide desktop" breakpoint.
export default function PortalSelect() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-paper p-6 relative overflow-hidden">
      <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-teal/10 blur-[80px]" />
      <div className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-amber/[0.07] blur-[80px]" />

      <div className="w-full max-w-sm relative">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-[linear-gradient(150deg,#0C443E_0%,#1B7A72_60%,#2FA096_100%)] flex items-center justify-center shadow-lg shadow-teal/25">
              <Cross size={20} strokeWidth={2.5} className="text-white" />
            </div>
            <span className="font-semibold text-[19px] tracking-tight text-ink">
              BIC SmartCare
            </span>
          </div>
          <h1 className="text-[22px] font-extrabold text-ink">Welcome</h1>
          <p className="text-[13px] text-slate-soft mt-1.5">
            Choose your portal to sign in.
          </p>
        </div>

        <div className="space-y-3">
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
                  <span className="block text-[14.5px] font-semibold text-ink">
                    {p.label}
                  </span>
                  <span className="block text-[12px] text-slate-soft mt-0.5">
                    {p.desc}
                  </span>
                </span>
                <ArrowRight
                  size={16}
                  className="text-slate-soft group-hover:text-teal group-hover:translate-x-0.5 transition-all shrink-0"
                />
              </Link>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-slate-soft mt-8 font-mono">
          Biratnagar International College · Summer Enrichment Programme
        </p>
      </div>
    </div>
  );
}
