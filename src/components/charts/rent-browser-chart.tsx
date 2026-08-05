"use client";

import { useState } from "react";
import { RentComparisonChart } from "@/components/charts/rent-comparison-chart";
import { ChartNav } from "@/components/charts/chart-nav";

export type RentBrowserObjekt = {
  id: string;
  name: string;
  ist: number;
  ziel: number;
  wohnungen: { name: string; ist: number; ziel: number }[];
};

export function RentBrowserChart({ objekte }: { objekte: RentBrowserObjekt[] }) {
  const [scope, setScope] = useState("alle");
  const selected = objekte.find((o) => o.id === scope);

  const data = selected
    ? selected.wohnungen
    : objekte.map((o) => ({ name: o.name, ist: o.ist, ziel: o.ziel }));

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h2 className="font-semibold">Miete/m²: Ist vs. Ziel</h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            {selected
              ? `Wohnungen in ${selected.name}`
              : "Durchschnitt je Objekt, portfolioweit"}
          </p>
        </div>
        <ChartNav objekte={objekte} scope={scope} onChange={setScope} />
      </div>
      <div className="mt-3">
        <RentComparisonChart data={data} />
      </div>
    </div>
  );
}
