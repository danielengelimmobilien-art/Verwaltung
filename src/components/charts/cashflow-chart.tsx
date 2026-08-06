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

export function CashflowChart({
  data,
}: {
  data: { name: string; miete: number; bankrate: number }[];
}) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">Noch keine Daten vorhanden.</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 4 }}>
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
          formatter={(value) =>
            new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
              Number(value)
            )
          }
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="bankrate" name="Bankrate" fill="var(--bad)" radius={[4, 4, 0, 0]} fillOpacity={0.6} />
        <Bar dataKey="miete" name="Nettokaltmiete" fill="var(--good)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
