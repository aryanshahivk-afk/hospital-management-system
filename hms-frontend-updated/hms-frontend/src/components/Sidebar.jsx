import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Cross, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ navItems, roleLabel, userSub }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const initials = (user?.name || "")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between gap-2.5 px-6 h-20 border-b border-line">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-teal flex items-center justify-center shrink-0 shadow-sm shadow-teal/30">
            <Cross size={18} strokeWidth={2.5} className="text-white" />
          </div>
          <div className="leading-tight">
            <p className="font-display font-semibold text-[16px] tracking-tight text-ink">BIC SmartCare</p>
            <p className="text-[11px] text-slate-soft tracking-wide uppercase">{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-slate-soft hover:text-ink p-1"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `group relative flex items-center justify-between gap-3 pl-3.5 pr-3 py-2.5 rounded-lg text-[14px] transition-colors ${
                isActive
                  ? "bg-teal-light text-teal font-medium"
                  : "text-slate hover:text-ink hover:bg-paper-dim/60"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-teal" />
                )}
                <span className="flex items-center gap-3">
                  <Icon
                    size={17}
                    strokeWidth={isActive ? 2.3 : 2}
                    className={isActive ? "text-teal" : "text-slate-soft group-hover:text-ink"}
                  />
                  {label}
                </span>
                {badge && (
                  <span className="text-[9px] font-semibold tracking-wide uppercase bg-amber text-white px-1.5 py-0.5 rounded">
                    New
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-line">
        <div className="flex items-center gap-3 px-2.5 py-2.5 mb-2 rounded-lg bg-paper-dim/50">
          <div className="w-8 h-8 rounded-full bg-amber flex items-center justify-center text-[12px] font-semibold text-white shrink-0">
            {initials || "?"}
          </div>
          <div className="leading-tight min-w-0">
            <p className="text-[13px] font-medium text-ink truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-soft truncate">{userSub}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-[13px] text-slate-soft hover:text-danger hover:bg-danger-light transition-colors"
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 h-16 px-4 bg-white border-b border-line">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-slate hover:text-ink p-1.5 -ml-1.5"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <div className="w-7 h-7 rounded-lg bg-teal flex items-center justify-center shrink-0">
          <Cross size={14} strokeWidth={2.5} className="text-white" />
        </div>
        <p className="font-display font-semibold text-[15px] tracking-tight text-ink">BIC SmartCare</p>
      </div>

      <aside className="hidden lg:flex w-64 shrink-0 bg-white text-slate flex-col h-screen sticky top-0 border-r border-line">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-ink/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[80vw] bg-white text-slate flex flex-col h-full shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
