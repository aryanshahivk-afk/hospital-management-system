import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Cross, Stethoscope, ArrowRight, AlertCircle, Eye, EyeOff, ChevronLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Deliberately a completely different composition from Staff/Patient — a single
// centered, minimal card instead of a split hero screen, to read as a focused clinical
// tool rather than a consumer app or an admin console. Same brand colors as the rest of
// the app throughout (teal/ink/paper) — only the layout and tone differ.
export default function DoctorLogin() {
  const navigate = useNavigate();
  const { loginDoctor } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await loginDoctor(username.trim().toLowerCase(), password);
      if (result.ok) {
        if (result.user?.mustChangePassword) {
          navigate("/change-password", { state: { home: "/doctor" } });
        } else {
          navigate("/doctor");
        }
      } else {
        setError(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-paper p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-6">
          <Link to="/login" className="flex items-center gap-1 text-[12px] text-slate-soft hover:text-ink">
            <ChevronLeft size={13} /> Choose a different portal
          </Link>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-teal flex items-center justify-center">
              <Cross size={11} strokeWidth={2.5} className="text-white" />
            </div>
            <span className="text-[11px] font-semibold text-ink">BIC SmartCare</span>
          </div>
        </div>

        <div className="bg-white border border-line rounded-xl px-8 py-9 flex flex-col items-center text-center">
          <div className="rounded-2xl bg-[linear-gradient(150deg,#0C443E_0%,#1B7A72_60%,#2FA096_100%)] flex items-center justify-center shadow-lg shadow-teal/20 mb-5" style={{ width: 52, height: 52 }}>
            <Stethoscope size={24} strokeWidth={2} className="text-white" />
          </div>
          <h1 className="text-[18px] font-semibold text-ink">Doctor Access</h1>
          <p className="text-[12px] text-slate-soft mt-1">BIC SmartCare Clinical Portal</p>

          <form onSubmit={handleSubmit} className="w-full mt-7 space-y-3.5 text-left">
            <div>
              <label className="block text-[12px] font-medium text-slate mb-1.5">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. sabina.basnet"
                autoComplete="username"
                className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate mb-1.5">Password</label>
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
              className="w-full mt-1 bg-[linear-gradient(135deg,#0C443E,#1B7A72)] text-white py-3 rounded-lg text-[13.5px] font-semibold flex items-center justify-center gap-2 shadow-md shadow-teal/20 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Signing in…" : "Sign in"}
              {!submitting && <ArrowRight size={15} />}
            </button>
          </form>

          <p className="text-[10.5px] text-slate-soft mt-5 font-mono">Restricted access — clinical staff only</p>
        </div>

        <p className="text-[11px] text-slate-soft mt-5 text-center font-mono">Demo credentials — sabina.basnet / doctor123</p>
      </div>
    </div>
  );
}
