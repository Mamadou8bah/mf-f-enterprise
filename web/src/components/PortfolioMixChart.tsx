"use client";

import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type Slice = { name: string; value: number; color: string };

function MixTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; payload?: Slice }[];
}) {
  if (!active || !payload?.[0]) return null;
  const row = payload[0];
  return (
    <div className="rounded-2xl border border-garawol-line bg-white px-3 py-2 shadow-card">
      <p className="text-xs font-semibold text-garawol-ink">{row.name}</p>
      <p className="text-sm font-bold tabular-nums text-garawol-ink">{row.value}</p>
    </div>
  );
}

export function PortfolioMixChart({
  occupied,
  vacant,
  unitCount,
}: {
  occupied: number;
  vacant: number;
  unitCount: number;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const other = Math.max(0, unitCount - occupied - vacant);
  const data: Slice[] = [
    { name: "Occupied", value: occupied, color: "#0B2F6B" },
    { name: "Vacant", value: vacant, color: "#C9A227" },
    ...(other > 0 ? [{ name: "Other", value: other, color: "#D5DEEA" }] : []),
  ].filter((d) => d.value > 0);

  const occupiedPct = unitCount > 0 ? Math.round((occupied / unitCount) * 100) : 0;

  if (!ready || data.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-[1.25rem] bg-garawol-mist">
        <p className="text-sm text-garawol-muted">No unit data</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              outerRadius={68}
              paddingAngle={2}
              stroke="#fff"
              strokeWidth={2}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<MixTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xl font-bold tabular-nums text-garawol-ink">{occupiedPct}%</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-garawol-soft">
            Occupied
          </p>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2">
        {data.map((d) => (
          <li key={d.name} className="flex items-center justify-between gap-2 text-sm">
            <span className="inline-flex items-center gap-2 font-medium text-garawol-ink">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
              {d.name}
            </span>
            <span className="font-bold tabular-nums text-garawol-ink">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
