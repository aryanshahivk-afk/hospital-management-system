import { Users, CalendarClock, Stethoscope, Landmark, ArrowUpRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import Topbar from "../components/Topbar";
import { StatCard, Card, StatusPill, formatNPR } from "../components/ui";
import { useData } from "../context/DataContext";

const pieColors = ["#1B7A72", "#C9762C", "#0F2A3D", "#6B7680"];

export default function Dashboard() {
  const { appointments, emiApplications, dashboardStats, revenueTrend, departmentLoad, loading, error } = useData();

  if (!dashboardStats) {
    return (
      <>
        <Topbar title="Dashboard" subtitle={error ? "Couldn't load" : "Loading…"} />
        <div className="p-8">
          {error ? (
            <div className="max-w-md bg-danger-light text-danger rounded-lg px-4 py-3 text-[13px]">
              <p className="font-medium mb-1">Couldn't reach the server.</p>
              <p>{error}</p>
              <p className="mt-2 text-[12px] opacity-80">
                Check that the backend is running and that VITE_API_BASE_URL in your .env matches it, then refresh.
              </p>
            </div>
          ) : (
            <p className="text-[13px] text-slate-soft">
              {loading ? "Fetching the latest numbers from the server…" : "No data yet."}
            </p>
          )}
        </div>
      </>
    );
  }
  return (
    <>
      <Topbar title="Dashboard" subtitle="Tuesday, August 4, 2026 · Overview across all departments" />

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Patients" value={dashboardStats.totalPatients.toLocaleString()} sub="+18 this week" icon={Users} tone="ink" />
          <StatCard label="Today's Appointments" value={dashboardStats.todayAppointments} sub="5 pending confirmation" icon={CalendarClock} tone="teal" />
          <StatCard label="Active Doctors" value={dashboardStats.activeDoctors} sub="across 4 departments" icon={Stethoscope} tone="ink" />
          <StatCard label="EMI Approvals Pending" value={dashboardStats.pendingEmiApprovals} sub="needs admin review" icon={Landmark} tone="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card title="Revenue & EMI collections" className="lg:col-span-2 pb-5">
            <div className="px-5 pt-3">
              <div className="flex items-baseline gap-2">
                <p className="font-display text-[26px] font-semibold text-ink">{formatNPR(dashboardStats.revenueThisMonth)}</p>
                <span className="text-[12px] text-success font-medium flex items-center gap-0.5">
                  <ArrowUpRight size={13} /> 14.5% vs last month
                </span>
              </div>
              <p className="text-[12px] text-slate-soft mt-0.5">Total collected · {formatNPR(dashboardStats.outstandingBalance)} outstanding across active EMI plans</p>
            </div>
            <div className="h-56 mt-2 px-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1B7A72" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#1B7A72" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="emiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C9762C" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#C9762C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2DED3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7680" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6B7680" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} width={40} />
                  <Tooltip
                    formatter={(v) => formatNPR(v)}
                    contentStyle={{ borderRadius: 8, border: "1px solid #E2DED3", fontSize: 12, fontFamily: "Inter" }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#1B7A72" strokeWidth={2} fill="url(#revGrad)" name="Total revenue" />
                  <Area type="monotone" dataKey="emi" stroke="#C9762C" strokeWidth={2} fill="url(#emiGrad)" name="EMI collections" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Bed occupancy by department" className="pb-5">
            <div className="h-48 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={departmentLoad} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3}>
                    {departmentLoad.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2DED3", fontSize: 12, fontFamily: "Inter" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="px-5 space-y-1.5 mt-1">
              {departmentLoad.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-[12.5px]">
                  <span className="flex items-center gap-2 text-slate">
                    <span className="w-2 h-2 rounded-full" style={{ background: pieColors[i % pieColors.length] }} />
                    {d.name}
                  </span>
                  <span className="font-mono text-slate-soft">{d.value} beds</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card title="Today's appointments" className="lg:col-span-2 pb-2">
            <div className="mt-3 divide-y divide-line">
              {appointments.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-[13.5px] font-medium text-ink">{a.patient}</p>
                    <p className="text-[12px] text-slate-soft">{a.doctor} · {a.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[12.5px] text-slate">{a.time}</p>
                    <div className="mt-1"><StatusPill status={a.status} /></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="EMI applications" className="pb-2">
            <div className="mt-3 divide-y divide-line">
              {emiApplications.map((e) => (
                <div key={e.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[13.5px] font-medium text-ink">{e.patient}</p>
                    <StatusPill status={e.status} />
                  </div>
                  <p className="text-[12px] text-slate-soft mt-0.5 font-mono">{formatNPR(e.amount)} · {e.tenure} mo</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
