import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Download, Loader2 } from "lucide-react";
import Topbar from "../components/Topbar";
import { Card, formatNPR } from "../components/ui";
import { useData } from "../context/DataContext";
import { exportReportToExcel } from "../utils/exportReport";

export default function Reports() {
  const { revenueTrend, departmentLoad, dashboardStats, loading, error } = useData();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  function handleExport() {
    setExporting(true);
    setExportError("");
    try {
      exportReportToExcel({ dashboardStats, revenueTrend, departmentLoad });
    } catch (err) {
      setExportError("Couldn't generate the file. Please try again.");
      console.error(err);
    } finally {
      setExporting(false);
    }
  }

  if (!dashboardStats) {
    return (
      <>
        <Topbar title="Reports" subtitle={error ? "Couldn't load" : "Loading…"} />
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
      <Topbar title="Reports" subtitle="Monthly summaries across billing, EMI, and departments" />

      <div className="p-8 space-y-6">
        <div className="flex justify-end items-center gap-3">
          {exportError && <p className="text-[12.5px] text-danger">{exportError}</p>}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 border border-line bg-white px-4 py-2.5 rounded-lg text-[13.5px] font-medium text-slate hover:bg-paper-dim transition-colors disabled:opacity-60"
          >
            {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            {exporting ? "Generating…" : "Export report"}
          </button>
        </div>

        <Card title="Monthly revenue vs EMI collections">
          <div className="h-64 mt-3 px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2DED3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7680" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7680" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} width={40} />
                <Tooltip formatter={(v) => formatNPR(v)} contentStyle={{ borderRadius: 8, border: "1px solid #E2DED3", fontSize: 12, fontFamily: "Inter" }} />
                <Bar dataKey="revenue" fill="#1B7A72" radius={[4, 4, 0, 0]} name="Total revenue" />
                <Bar dataKey="emi" fill="#C9762C" radius={[4, 4, 0, 0]} name="EMI collections" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Department occupancy">
            <div className="h-56 mt-3 px-2 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentLoad} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2DED3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7680" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#3A4750" }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2DED3", fontSize: 12, fontFamily: "Inter" }} />
                  <Bar dataKey="value" fill="#0F2A3D" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Key figures this month">
            <div className="p-5 grid grid-cols-2 gap-5">
              <div>
                <p className="text-[11px] text-slate-soft uppercase tracking-wide">Revenue</p>
                <p className="font-mono text-[18px] font-semibold text-ink mt-1">{formatNPR(dashboardStats.revenueThisMonth)}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-soft uppercase tracking-wide">Outstanding</p>
                <p className="font-mono text-[18px] font-semibold text-amber mt-1">{formatNPR(dashboardStats.outstandingBalance)}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-soft uppercase tracking-wide">Total patients</p>
                <p className="font-mono text-[18px] font-semibold text-ink mt-1">{dashboardStats.totalPatients.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-soft uppercase tracking-wide">Active doctors</p>
                <p className="font-mono text-[18px] font-semibold text-ink mt-1">{dashboardStats.activeDoctors}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
