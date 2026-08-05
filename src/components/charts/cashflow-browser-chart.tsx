"use client";

import { useState } from "react";
import { CashflowChart } from "@/components/charts/cashflow-chart";
import { ChartNav } from "@/components/charts/chart-nav";
import { formatEuro } from "@/lib/calc";

export type CashflowBrowserObjekt = {
  id: string;
  name: string;
  miete: number;
  bankrate: number;
};

export function CashflowBrowserChart({
  objekte,
}: {
  objekte: CashflowBrowserObjekt[];
}) {
  const [scope, setScope] = useState("alle");
  const selected = objekte.find((o) => o.id === scope);

  const data = selected
    ? [{ name: selected.name, miete: selected.miete, bankrate: selected.bankrate }]
    : objekte.map((o) => ({ name: o.name, miete: o.miete, bankrate: o.bankrate }));

  const cashflow = selected
    ? selected.miete - selected.bankrate
    : objekte.reduce((s, o) => s + (o.miete - o.bankrate), 0);

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h2 className="font-semibold">Kreditrate vs. Nettokaltmiete</h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            {selected ? selected.name : "Alle Objekte im Vergleich"} · Cashflow:{" "}
            <span
              className="font-semibold"
              style={{ color: cashflow >= 0 ? "var(--good)" : "var(--bad)" }}
            >
              {formatEuro(cashflow)}
            </span>
          </p>
        </div>
        <ChartNav objekte={objekte} scope={scope} onChange={setScope} />
      </div>
      <div className="mt-3">
        <CashflowChart data={data} />
      </div>
    </div>
  );
}
