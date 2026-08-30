import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Cross,
  ArrowRight,
  AlertCircle,
  Users,
  CalendarClock,
  ReceiptText,
  UserCircle2,
  Contact,
  Stethoscope,
  HeartPulse,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const TABS = [
  { key: "admin", label: "Administrator", short: "Admin", home: "/", icon: UserCircle2, defaultUsername: "admin" },
  { key: "frontdesk", label: "Front Desk", short: "Front Desk", home: "/frontdesk", icon: Contact, defaultUsername: "frontdesk" },
  { key: "doctor", label: "Doctor", short: "Doctor", home: "/doctor", icon: Stethoscope },
  { key: "patient", label: "Patient", short: "Patient", home: "/patient", icon: HeartPulse },
];

export default function Login() {
  const navigate = useNavigate();
  const { loginAdmin, loginFrontDesk, loginDoctor, loginPatient, doctorOptions, patientOptions, optionsError, reloadLoginOptions } = useAuth();
  const doctors = doctorOptions;
  const patients = patientOptions;
  const [tab, setTab] = useState("admin");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Belt-and-suspenders: refetch the dropdown lists whenever this screen is reached,
  // so a patient/doctor added earlier in the session is never stale here.
  useEffect(() => {
    reloadLoginOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedId, setSelectedId] = useState("");

  // Options load asynchronously from the API — default the dropdown once they arrive.
  useEffect(() => {
    if (tab === "doctor" && !selectedId && doctors[0]) setSelectedId(doctors[0].id);
    if (tab === "patient" && !selectedId && patients[0]) setSelectedId(patients[0].id);
  }, [doctors, patients, tab, selectedId]);

  function switchTab(key) {
    setTab(key);
    setPassword("");
    setError("");
    const t = TABS.find((x) => x.key === key);
    if (t.defaultUsername) setUsername(t.defaultUsername);
    if (key === "doctor") setSelectedId(doctors[0]?.id ?? "");
    if (key === "patient") setSelectedId(patients[0]?.id ?? "");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      let result;
      if (tab === "admin") {
        result = await loginAdmin(username, password);
      } else if (tab === "frontdesk") {
        result = await loginFrontDesk(username, password);
      } else if (tab === "doctor") {
        const doctor = doctors.find((d) => d.id === selectedId);
        result = await loginDoctor(doctor, password);
      } else {
        const patient = patients.find((p) => p.id === selectedId);
        result = await loginPatient(patient, password);
      }

      if (result.ok) {
        navigate(TABS.find((t) => t.key === tab).home);
      } else {
        setError(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const hint =
    tab === "admin" ? "admin / admin123" :
    tab === "frontdesk" ? "frontdesk / frontdesk123" :
    tab === "doctor" ? "password: doctor123" : "password: patient123";

  return (
    <div className="min-h-screen w-full flex bg-paper">
      <div className="hidden lg:flex lg:w-1/2 text-ink flex-col justify-between p-12 relative overflow-hidden bg-[linear-gradient(150deg,#CDEAE4_0%,#EAF4F1_35%,#FAFCFB_70%,#FFFFFF_100%)] border-r-[3px] border-teal">
        {/* soft glow + accent shape kept in the top corner so nothing ever crosses the footer text */}
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
            built in for bills patients can't pay all at once. Admins, doctors, and
            patients each sign in to their own view.
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

          <h2 className="text-[22px] font-semibold text-ink">Sign in</h2>
          <p className="text-[13px] text-slate-soft mt-1.5">Choose your role to continue.</p>

          <div className="grid grid-cols-2 gap-2.5 mt-6">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => switchTab(t.key)}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl border-[1.5px] text-[12px] font-semibold transition-colors ${
                    active
                      ? "bg-teal-light border-teal text-[#0C443E]"
                      : "bg-white border-line text-slate-soft hover:border-teal/40"
                  }`}
                >
                  <Icon size={20} strokeWidth={2} className={active ? "text-[#0C443E]" : "text-slate-soft"} />
                  {t.short}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {(tab === "admin" || tab === "frontdesk") && (
              <div>
                <label className="block text-[12.5px] font-medium text-slate mb-1.5">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={tab === "admin" ? "admin" : "frontdesk"}
                  autoComplete="username"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                />
              </div>
            )}

            {tab === "doctor" && (
              <div>
                <label className="block text-[12.5px] font-medium text-slate mb-1.5">Select your name</label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} · {d.specialty}</option>
                  ))}
                </select>
              </div>
            )}

            {tab === "patient" && (
              <div>
                <label className="block text-[12.5px] font-medium text-slate mb-1.5">Select your name</label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} · {p.id}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[12.5px] font-medium text-slate mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 pr-11 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-soft hover:text-ink transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {(error || optionsError) && (
              <div className="flex items-center gap-2 text-[12.5px] text-danger bg-danger-light px-3 py-2 rounded-lg">
                <AlertCircle size={14} className="shrink-0" /> {error || optionsError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 bg-[linear-gradient(135deg,#0C443E,#1B7A72)] text-white py-3.5 rounded-full text-[14px] font-semibold flex items-center justify-center gap-2 shadow-lg shadow-teal/30 hover:shadow-xl hover:shadow-teal/40 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Signing in…" : `Sign in as ${TABS.find((t) => t.key === tab).label}`}
              {!submitting && <ArrowRight size={15} />}
            </button>
          </form>

          <p className="text-[12px] text-slate-soft mt-8 text-center font-mono">
            Demo credentials — {hint}
          </p>
        </div>
      </div>
    </div>
  );
}
