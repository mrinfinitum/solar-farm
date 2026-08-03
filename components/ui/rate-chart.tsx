"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { rateComparison } from "@/lib/project-data";

type TooltipPayload = {
  dataKey?: string | number;
  value?: number | string;
  name?: string;
  color?: string;
};

function RateTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip">
      <span>{label}</span>
      {payload.map((item) => (
        <div key={String(item.dataKey)}>
          <i style={{ background: item.color }} />
          <small>{item.name}</small>
          <strong>
            ${Number(item.value).toFixed(4)}
            <em>/kWh</em>
          </strong>
        </div>
      ))}
    </div>
  );
}

export function RateChart() {
  return (
    <div className="chart-wrap">
      <div className="chart-legend" aria-hidden="true">
        <span><i className="legend-utility" /> Modeled PSO baseline</span>
        <span><i className="legend-ppa" /> Indicative project PPA rate</span>
      </div>
      <div className="chart-canvas" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rateComparison} margin={{ top: 20, right: 18, left: 4, bottom: 8 }}>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="4 7" vertical={false} />
            <XAxis
              dataKey="year"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--chart-axis)", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-geist-mono)" }}
              dy={14}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              domain={[0.07, 0.15]}
              tickFormatter={(value) => `$${Number(value).toFixed(2)}`}
              width={72}
              tick={{ fill: "var(--chart-axis)", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-geist-mono)" }}
            />
            <Tooltip content={<RateTooltip />} cursor={{ stroke: "var(--chart-cursor)", strokeWidth: 2, strokeDasharray: "4 5" }} />
            <Line
              type="monotone"
              dataKey="utility"
              name="Modeled PSO baseline"
              stroke="var(--chart-utility)"
              strokeWidth={3.5}
              dot={{ r: 5, fill: "var(--chart-utility)", stroke: "var(--chart-surface)", strokeWidth: 2 }}
              activeDot={{ r: 8, fill: "var(--chart-surface)", stroke: "var(--chart-utility)", strokeWidth: 3 }}
              animationDuration={700}
            />
            <Line
              type="monotone"
              dataKey="ppa"
              name="Indicative project PPA"
              stroke="var(--chart-ppa)"
              strokeWidth={4}
              dot={{ r: 5, fill: "var(--chart-ppa)", stroke: "var(--chart-surface)", strokeWidth: 2 }}
              activeDot={{ r: 8, fill: "var(--chart-surface)", stroke: "var(--chart-ppa)", strokeWidth: 3 }}
              animationDuration={700}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Indicative energy rate comparison in dollars per kilowatt-hour</caption>
        <thead><tr><th>Period</th><th>Modeled PSO baseline</th><th>Indicative project PPA</th></tr></thead>
        <tbody>
          {rateComparison.map((row) => (
            <tr key={row.year}><th>{row.year}</th><td>${row.utility}</td><td>${row.ppa}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="chart-reference-note">* Year 20 values are average reference points supplied for this indicative model.</p>
    </div>
  );
}
