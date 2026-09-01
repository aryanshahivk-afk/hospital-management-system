import { useState, useEffect, useRef, useMemo } from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { Activity, AlertTriangle, CheckCircle2, Info, Loader2 } from "lucide-react";
import Topbar from "../components/Topbar";
import { Card, formatNPR } from "../components/ui";
import { useData } from "../context/DataContext";
import { simulateEmiRiskApi } from "../api/data";
import { ApiError } from "../api/client";

const BAND_STYLE = {
  Low: { text: "text-success", bg: "bg-success-light", ring: "#2F8F5B" },
  Medium: { text: "text-amber", bg: "bg-amber-light", ring: "#C9762C" },
  High: { text: "text-danger", bg: "bg-danger-light", ring: "#C0483B" },
};

// Interpolates smoothly between success -> amber -> danger as the score climbs,
// so the gauge visibly "moves through" risk territory rather than jumping in three flat steps.
function scoreColor(score) {
  if (score <= 30) return "#2F8F5B";
  if (score <= 60) return "#C9762C";
  return "#C0483B";
}

export default function RiskSimulator() {
  const { patients, EMI_MIN, EMI_MAX } = useData();

  const [patientId, setPatientId] = useState("");
  const [amount, setAmount] = useState(100000);
  const [tenure, setTenure] = useState(6);
  const [monthlyIncome, setMonthlyIncome] = useState(40000);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const debounceRef = useRef(null);

  // Default to the first patient once the list has loaded.
  useEffect(() => {
    if (!patientId && patients.length > 0) setPatientId(patients[0].id);
  }, [patients, patientId]);

  // Debounced live recalculation — fires ~350ms after the last slider move so dragging
  // stays smooth instead of firing a request per pixel.
  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    setError("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await simulateEmiRiskApi(patientId, amount, tenure, monthlyIncome);
        setResult(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Couldn't reach the server.");
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [patientId, amount, tenure, monthlyIncome]);

  const gaugeData = useMemo(
    () => [{ name: "risk", value: result?.score ?? 0, fill: scoreColor(result?.score ?? 0) }],
    [result]
  );

  const band = result?.band && BAND_STYLE[result.band] ? result.band : null;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar title="EMI Risk Simulator" subtitle="Drag the sliders to see how the risk model reacts, live." />
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Controls */}
        <Card title="What if…" className="lg:col-span-2 p-5 space-y-6">
          <div>
            <label className="text-[12px] font-medium text-slate-soft uppercase tracking-wide">Patient</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="mt-1.5 w-full border border-line rounded-lg px-3 py-2.5 text-[14px] bg-white text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium text-slate-soft uppercase tracking-wide">Monthly Income</label>
              <span className="font-display font-semibold text-ink text-[15px]">{formatNPR(monthlyIncome)}</span>
            </div>
            <input
              type="range"
              min={5000}
              max={300000}
              step={1000}
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(Number(e.target.value))}
              className="mt-2 w-full accent-teal"
            />
            <div className="flex justify-between text-[11px] text-slate-soft mt-1">
              <span>{formatNPR(5000)}</span>
              <span>{formatNPR(300000)}</span>
            </div>
            <p className="text-[11px] text-slate-soft mt-1.5">This is the primary driver of the score — see for yourself below.</p>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium text-slate-soft uppercase tracking-wide">EMI Amount</label>
              <span className="font-display font-semibold text-ink text-[15px]">{formatNPR(amount)}</span>
            </div>
            <input
              type="range"
              min={EMI_MIN}
              max={EMI_MAX}
              step={1000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mt-2 w-full accent-teal"
            />
            <div className="flex justify-between text-[11px] text-slate-soft mt-1">
              <span>{formatNPR(EMI_MIN)}</span>
              <span>{formatNPR(EMI_MAX)}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium text-slate-soft uppercase tracking-wide">Tenure</label>
              <span className="font-display font-semibold text-ink text-[15px]">{tenure} months</span>
            </div>
            <input
              type="range"
              min={1}
              max={24}
              step={1}
              value={tenure}
              onChange={(e) => setTenure(Number(e.target.value))}
              className="mt-2 w-full accent-teal"
            />
            <div className="flex justify-between text-[11px] text-slate-soft mt-1">
              <span>1 month</span>
              <span>24 months</span>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-teal-light/60 text-teal rounded-lg px-3.5 py-3 text-[12.5px]">
            <Info size={15} className="shrink-0 mt-0.5" />
            <p>Nothing is saved here — this only previews the same scoring model used on real applications, so front desk can talk a patient through options before they formally apply.</p>
          </div>
        </Card>

        {/* Live result */}
        <Card title="Live Risk Assessment" className="lg:col-span-3 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <div className="relative flex items-center justify-center h-[220px]">
              <RadialBarChart
                width={220}
                height={220}
                cx="50%"
                cy="50%"
                innerRadius="72%"
                outerRadius="100%"
                barSize={16}
                data={gaugeData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={8} isAnimationActive animationDuration={500} />
              </RadialBarChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {loading ? (
                  <Loader2 size={22} className="animate-spin text-slate-soft" />
                ) : (
                  <>
                    <span className="font-display text-[36px] font-bold text-ink leading-none">{result?.score ?? "–"}</span>
                    <span className="text-[11px] text-slate-soft mt-1">out of 100</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {band && (
                <span className={`inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-full ${BAND_STYLE[band].bg} ${BAND_STYLE[band].text}`}>
                  <AlertTriangle size={14} /> {band} Risk
                </span>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-paper-dim/60 rounded-lg px-3.5 py-3">
                  <p className="text-[11px] text-slate-soft uppercase tracking-wide">Est. Monthly</p>
                  <p className="font-display font-semibold text-ink text-[15px] mt-0.5">
                    {result ? formatNPR(result.estimatedMonthlyInstallment) : "–"}
                  </p>
                </div>
                <div className="bg-paper-dim/60 rounded-lg px-3.5 py-3">
                  <p className="text-[11px] text-slate-soft uppercase tracking-wide">Suggested Tenure</p>
                  <p className="font-display font-semibold text-ink text-[15px] mt-0.5">
                    {result ? `${result.suggestedTenureMonths} months` : "–"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-line">
            <p className="text-[12px] font-medium text-slate-soft uppercase tracking-wide mb-2">Why this score</p>
            {error && (
              <p className="flex items-center gap-2 text-[13px] text-danger">
                <AlertTriangle size={14} /> {error}
              </p>
            )}
            {!error && (
              <ul className="space-y-2">
                {(result?.reasons ?? []).map((reason, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13.5px] text-slate">
                    <Activity size={14} className="shrink-0 mt-0.5 text-slate-soft" />
                    {reason}
                  </li>
                ))}
                {result?.reasons?.length === 0 && (
                  <li className="flex items-start gap-2 text-[13.5px] text-success">
                    <CheckCircle2 size={14} className="shrink-0 mt-0.5" /> No risk signals found.
                  </li>
                )}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
