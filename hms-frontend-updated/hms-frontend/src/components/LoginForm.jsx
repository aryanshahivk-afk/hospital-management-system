import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Cross, ArrowRight, AlertCircle, Eye, EyeOff, ChevronLeft, Users, CalendarClock, ReceiptText } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// One shared form, parametrized per portal — this is what makes each portal feel like
// its own separate login rather than a shared screen with a role switcher. `roles` is
// either a single-role config (Doctor/Patient portals) or two configs to toggle between
// (Staff portal, since Admin and Front Desk are still genuinely different accounts).
export default function LoginForm({ heroTitle, heroSubtitle, icon: HeroIcon, roles, portalLabel }) {
  const navigate = useNavigate();
  const auth = useAuth();
  const [roleKey, setRoleKey] = useState(roles[0].key);
  const activeRole = roles.find((r) => r.key === roleKey);

  const [username, setUsername] = useState(roles[0].defaultUsername || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function switchRole(key) {
    setRoleKey(key);
    setPassword("");
    setError("");
    const r = roles.find((x) => x.key === key);
    setUsername(r.defaultUsername || "");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const normalizedUsername = username.trim().toLowerCase();
      const result = await auth[activeRole.loginFn](normalizedUsername, password);
      if (result.ok) {
        if (result.user?.mustChangePassword) {
          navigate("/change-password", { state: { home: activeRole.home } });
        } else {
          navigate(activeRole.home);
        }
      } else {
        setError(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  }

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
          <div className="flex items-center gap-2 mb-4">
            <span className="w-9 h-9 rounded-xl bg-white/70 border border-teal/20 flex items-center justify-center text-teal">
              <HeroIcon size={18} />
            </span>
            <span className="text-[12.5px] font-semibold text-teal uppercase tracking-wide">{portalLabel}</span>
          </div>
          <p className="text-[34px] leading-[1.2] font-extrabold text-ink">{heroTitle}</p>
          <p className="text-slate text-[14.5px] mt-4 leading-relaxed">{heroSubtitle}</p>

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

          <Link to="/login" className="flex items-center gap-1 text-[12px] text-slate-soft hover:text-ink mb-5">
            <ChevronLeft size={13} /> Choose a different portal
          </Link>

          <div className="flex items-center gap-2 mb-1.5">
            <HeroIcon size={20} className="text-teal" />
            <h2 className="text-[22px] font-semibold text-ink">{portalLabel} Login</h2>
          </div>
          <p className="text-[13px] text-slate-soft">
            {roles.length > 1 ? "Choose your role and sign in." : "Sign in to continue."}
          </p>

          {roles.length > 1 && (
            <div className="grid grid-cols-2 gap-2.5 mt-5">
              {roles.map((r) => {
                const Icon = r.icon;
                const active = roleKey === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => switchRole(r.key)}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border-[1.5px] text-[13px] font-semibold transition-colors ${
                      active ? "bg-teal-light border-teal text-[#0C443E]" : "bg-white border-line text-slate-soft hover:border-teal/40"
                    }`}
                  >
                    <Icon size={16} className={active ? "text-[#0C443E]" : "text-slate-soft"} />
                    {r.label}
                  </button>
                );
              })}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-[12.5px] font-medium text-slate mb-1.5">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={activeRole.placeholder}
                autoComplete="username"
                className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
              />
            </div>

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

            {error && (
              <div className="flex items-center gap-2 text-[12.5px] text-danger bg-danger-light px-3 py-2 rounded-lg">
                <AlertCircle size={14} className="shrink-0" /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 bg-[linear-gradient(135deg,#0C443E,#1B7A72)] text-white py-3.5 rounded-full text-[14px] font-semibold flex items-center justify-center gap-2 shadow-lg shadow-teal/30 hover:shadow-xl hover:shadow-teal/40 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Signing in…" : `Sign in as ${activeRole.label}`}
              {!submitting && <ArrowRight size={15} />}
            </button>
          </form>

          <p className="text-[12px] text-slate-soft mt-8 text-center font-mono">
            Demo credentials — {activeRole.hint}
          </p>
        </div>
      </div>
    </div>
  );
}
