import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Cross, ShieldCheck, AlertCircle, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { changePasswordApi } from "../api/auth";
import { ApiError } from "../api/client";

// Shown right after a Doctor/Patient logs in for the first time (or with a
// staff-assigned temporary password). They can't reach any dashboard until they
// set a real password only they know.
export default function ChangePassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearMustChangePassword, logout } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const home = location.state?.home || (user?.role === "doctor" ? "/doctor" : "/patient");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      await changePasswordApi(password);
      clearMustChangePassword();
      navigate(home, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update password. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-paper p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-line p-8 shadow-sm">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-lg bg-teal flex items-center justify-center text-white">
            <Cross size={18} strokeWidth={2.5} />
          </div>
          <p className="font-semibold text-lg text-ink tracking-tight">BIC SmartCare</p>
        </div>

        <div className="flex items-center gap-2 text-teal mb-1.5">
          <ShieldCheck size={18} />
          <h2 className="text-[18px] font-semibold text-ink">Set a new password</h2>
        </div>
        <p className="text-[13px] text-slate-soft mb-6">
          {user?.name ? `Welcome, ${user.name}. ` : ""}
          For your account's security, choose your own password before continuing — this replaces the temporary one you signed in with.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12.5px] font-medium text-slate mb-1.5">New password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
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

          <div>
            <label className="block text-[12.5px] font-medium text-slate mb-1.5">Confirm password</label>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              autoComplete="new-password"
              className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-[12.5px] text-danger bg-danger-light px-3 py-2 rounded-lg">
              <AlertCircle size={14} className="shrink-0" /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-1 bg-[linear-gradient(135deg,#0C443E,#1B7A72)] text-white py-3.5 rounded-full text-[14px] font-semibold flex items-center justify-center gap-2 shadow-lg shadow-teal/30 hover:shadow-xl hover:shadow-teal/40 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving…" : "Set password and continue"}
            {!submitting && <ArrowRight size={15} />}
          </button>

          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
            className="w-full text-[12.5px] text-slate-soft hover:text-ink transition-colors"
          >
            Sign out instead
          </button>
        </form>
      </div>
    </div>
  );
}
