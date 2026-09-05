import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Cross, Heart, ArrowRight, AlertCircle, Eye, EyeOff, ChevronLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Deliberately a completely different composition from Staff/Doctor — a rounder, softer
// centered card meant to feel like a consumer health app rather than an internal tool.
// Same brand colors as the rest of the app throughout — only the shapes and tone differ.
export default function PatientLogin() {
  const navigate = useNavigate();
  const { loginPatient } = useAuth();
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
      const result = await loginPatient(username.trim().toLowerCase(), password);
      if (result.ok) {
        if (result.user?.mustChangePassword) {
          navigate("/change-password", { state: { home: "/patient" } });
        } else {
          navigate("/patient");
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

        <div className="bg-white border border-line rounded-2xl px-8 py-9 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-teal-light" />

          <div className="relative w-14 h-14 rounded-full bg-white border border-line flex items-center justify-center mb-5" style={{ boxShadow: "0 2px 8px rgba(15,42,61,0.08)" }}>
            <Heart size={26} strokeWidth={2} className="text-teal" />
          </div>
          <h1 className="relative text-[19px] font-extrabold text-ink">Welcome back</h1>
          <p className="relative text-[12px] text-slate mt-1">Sign in to view your care</p>

          <form onSubmit={handleSubmit} className="relative w-full mt-7 space-y-3 text-left">
            <div>
              <label className="block text-[12px] font-medium text-slate mb-1.5">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. sujata.koirala"
                autoComplete="username"
                className="w-full px-4 py-2.5 rounded-xl border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
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
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-soft hover:text-ink transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-[12.5px] text-danger bg-danger-light px-3 py-2 rounded-xl">
                <AlertCircle size={14} className="shrink-0" /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 bg-teal text-white py-3 rounded-full text-[13.5px] font-semibold flex items-center justify-center gap-2 hover:bg-teal/90 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Signing in…" : "Sign in"}
              {!submitting && <ArrowRight size={15} />}
            </button>
          </form>
        </div>

        <p className="text-[11px] text-slate-soft mt-5 text-center font-mono">Demo credentials — sujata.koirala / patient123</p>
      </div>
    </div>
  );
}
