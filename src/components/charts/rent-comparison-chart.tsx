"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { performanceFarbe, zielAbweichungProzent } from "@/lib/calc";

export function RentComparisonChart({
  data,
}: {
  data: { name: string; ist: number; ziel: number }[];
}) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">Noch keine Daten vorhanden.</p>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="name"
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            unit=" €"
          />
          <Tooltip
            formatter={(value) => `${Number(value).toFixed(2)} €/m²`}
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="ist" name="Ist-Miete/m²" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={performanceFarbe(zielAbweichungProzent(d.ist, d.ziel))} />
            ))}
          </Bar>
          <Bar
            dataKey="ziel"
            name="Zielmiete/m²"
            fill="var(--accent)"
            fillOpacity={0.55}
            stroke="var(--accent)"
            strokeWidth={1.5}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-[var(--muted)]">
        <LegendSwatch color="var(--good)" label="Ist-Miete: auf Zielkurs (≥ -15 %)" />
        <LegendSwatch color="var(--warn)" label="beobachten (-15 % bis -30 %)" />
        <LegendSwatch color="var(--bad)" label="kritisch (< -30 %)" />
        <LegendSwatch color="var(--accent)" label="Zielmiete/m²" />
      </div>
    </div>
  );
}

function LegendSwatch({
  color,
  label,
  border,
}: {
  color: string;
  label: string;
  border?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-sm"
        style={{ background: color, border: border ? "1px solid var(--border)" : undefined }}
      />
      {label}
    </span>
  );
}
