"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatGmd, formatGmdCompact } from "@garawol/shared";

export type WeekPoint = {
  label: string;
  date: string;
  amount: number;
  count: number;
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey?: string | number; value?: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const amount = payload.find((p) => p.dataKey === "amount")?.value ?? 0;
  const count = payload.find((p) => p.dataKey === "count")?.value ?? 0;
  return (
    <div className="rounded-2xl border border-garawol-line bg-white px-3 py-2 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-garawol-soft">{label}</p>
      <p className="mt-1 text-sm font-bold tabular-nums text-garawol-ink">{formatGmd(amount)}</p>
      <p className="text-xs text-garawol-muted">
        {count} payment{count === 1 ? "" : "s"}
      </p>
    </div>
  );
}

export function WeekCollectionsChart({ data }: { data: WeekPoint[] }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const weekTotal = data.reduce((s, d) => s + d.amount, 0);
  const paymentTotal = data.reduce((s, d) => s + d.count, 0);

  if (!ready) {
    return (
      <div className="flex h-64 items-end gap-2 px-1">
        {data.map((d) => (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
            <div className="h-40 w-full rounded-2xl bg-garawol-mist" />
            <span className="text-xs font-semibold text-garawol-muted">{d.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-sm">
        <p className="font-semibold text-garawol-ink">
          Week total{" "}
          <span className="tabular-nums text-garawol-green">{formatGmdCompact(weekTotal)}</span>
        </p>
        <p className="text-garawol-muted">
          {paymentTotal} receipt{paymentTotal === 1 ? "" : "s"}
        </p>
      </div>
      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#E8EDF4" vertical={false} strokeDasharray="0" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#718096", fontSize: 12, fontWeight: 600 }}
              dy={8}
            />
            <YAxis
              yAxisId="amount"
              axisLine={false}
              tickLine={false}
              width={52}
              tick={{ fill: "#718096", fontSize: 11, fontWeight: 600 }}
              tickFormatter={(v: number) => formatGmdCompact(v).replace(/^D\s*/, "")}
            />
            <YAxis
              yAxisId="count"
              orientation="right"
              axisLine={false}
              tickLine={false}
              width={28}
              allowDecimals={false}
              tick={{ fill: "#718096", fontSize: 11, fontWeight: 600 }}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "#F3F6FA" }} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: 12, fontSize: 12, fontWeight: 600 }}
            />
            <Bar
              yAxisId="amount"
              dataKey="amount"
              name="Collected"
              fill="#0B2F6B"
              radius={[10, 10, 4, 4]}
              maxBarSize={42}
            />
            <Line
              yAxisId="count"
              type="monotone"
              dataKey="count"
              name="Receipts"
              stroke="#C9A227"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#C9A227", stroke: "#fff", strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
