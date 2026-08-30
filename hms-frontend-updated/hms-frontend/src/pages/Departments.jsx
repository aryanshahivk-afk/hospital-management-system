import Topbar from "../components/Topbar";
import { useData } from "../context/DataContext";

export default function Departments() {
  const { departments } = useData();
  return (
    <>
      <Topbar title="Departments" subtitle={`${departments.length} departments`} />

      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {departments.map((d) => {
          const pct = Math.round((d.occupied / d.beds) * 100);
          return (
            <div key={d.id} className="bg-white rounded-xl border border-line p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-[17px] font-semibold text-ink">{d.name}</p>
                  <p className="text-[12.5px] text-slate-soft mt-0.5">Head: {d.head}</p>
                </div>
                <span className="font-mono text-[11px] text-slate-soft bg-paper-dim px-2 py-1 rounded">{d.id}</span>
              </div>

              <div className="flex gap-6 mt-4">
                <div>
                  <p className="text-[11px] text-slate-soft uppercase tracking-wide">Doctors</p>
                  <p className="font-mono text-[15px] text-ink font-medium mt-0.5">{d.doctors}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-soft uppercase tracking-wide">Beds</p>
                  <p className="font-mono text-[15px] text-ink font-medium mt-0.5">{d.occupied} / {d.beds}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-[11.5px] text-slate-soft mb-1">
                  <span>Bed occupancy</span>
                  <span className="font-mono">{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-paper-dim overflow-hidden">
                  <div
                    className={`h-full rounded-full ${pct > 80 ? "bg-danger" : pct > 55 ? "bg-amber" : "bg-teal"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
