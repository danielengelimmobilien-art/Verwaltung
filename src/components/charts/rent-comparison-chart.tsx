"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="ist" name="Ist-Miete/m²" fill="var(--brand)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="ziel" name="Zielmiete/m²" fill="var(--warn)" radius={[4, 4, 0, 0]} fillOpacity={0.5} />
      </BarChart>
    </ResponsiveContainer>
  );
}
