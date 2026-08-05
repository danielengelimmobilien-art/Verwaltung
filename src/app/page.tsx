import Link from "next/link";
import { getPortfolioKennzahlen } from "@/lib/queries";
import { formatEuro, performanceLevel } from "@/lib/calc";
import { StatCard } from "@/components/ui/stat-card";
import { ObjektCard } from "@/components/objekt-card";
import { RentComparisonChart } from "@/components/charts/rent-comparison-chart";
import { CashflowChart } from "@/components/charts/cashflow-chart";

export default async function DashboardPage() {
  const kpi = await getPortfolioKennzahlen();
  const level = performanceLevel(kpi.abweichungProzent);
  const vermietungsquote = kpi.anzahlWohnungen
    ? Math.round((kpi.anzahlVermietet / kpi.anzahlWohnungen) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Portfolio-Übersicht</h1>
          <p className="text-[var(--muted)] text-sm mt-1">
            {kpi.anzahlObjekte} Objekte · {kpi.anzahlWohnungen} Wohnungen ·{" "}
            {kpi.anzahlVermietet} vermietet
          </p>
        </div>
        <Link
          href="/objekte"
          className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] w-fit"
        >
          + Neues Objekt
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Nettokaltmiete gesamt / Monat"
          value={formatEuro(kpi.gesamtKaltmiete)}
          hint={`${kpi.anzahlVermietet}/${kpi.anzahlWohnungen} Einheiten vermietet`}
        />
        <StatCard
          label="Ø Nettokaltmiete / m²"
          value={`${kpi.istProQmSchnitt.toFixed(2)} €`}
          hint={`Ziel: ${kpi.zielProQmSchnitt.toFixed(2)} €/m²`}
          tone={level === "kritisch" ? "bad" : level === "beobachten" ? "warn" : "good"}
        />
        <StatCard
          label="Cashflow / Monat"
          value={formatEuro(kpi.cashflowMonatlich)}
          hint={`Bankrate gesamt: ${formatEuro(kpi.gesamtBankrate)}`}
          tone={kpi.cashflowMonatlich >= 0 ? "good" : "bad"}
        />
        <StatCard
          label="Vermietungsquote"
          value={`${vermietungsquote} %`}
          hint={`${kpi.anzahlVermietet} von ${kpi.anzahlWohnungen} Wohnungen`}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-semibold mb-1">Miete/m² je Objekt: Ist vs. Ziel</h2>
          <p className="text-xs text-[var(--muted)] mb-4">
            Durchschnittliche Nettokaltmiete pro Quadratmeter im Vergleich zur Zielmiete
          </p>
          <RentComparisonChart
            data={kpi.objekte.map((o) => ({
              name: o.name,
              ist: Number(o.kennzahlen.istProQmSchnitt.toFixed(2)),
              ziel: Number(o.kennzahlen.zielProQmSchnitt.toFixed(2)),
            }))}
          />
        </div>
        <div className="card p-5">
          <h2 className="font-semibold mb-1">Cashflow je Objekt</h2>
          <p className="text-xs text-[var(--muted)] mb-4">
            Nettokaltmiete gesamt im Vergleich zur monatlichen Bankrate
          </p>
          <CashflowChart
            data={kpi.objekte.map((o) => ({
              name: o.name,
              miete: Math.round(o.kennzahlen.gesamtKaltmiete),
              bankrate: Math.round(o.bankrateMonatlich ?? 0),
            }))}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Objekte im Überblick</h2>
          <Link href="/objekte" className="text-sm text-[var(--brand)] font-medium">
            Alle Objekte →
          </Link>
        </div>
        {kpi.objekte.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Noch keine Objekte angelegt.{" "}
            <Link href="/objekte" className="text-[var(--brand)] font-medium">
              Erstes Objekt anlegen
            </Link>
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpi.objekte.map((objekt) => (
              <ObjektCard key={objekt.id} objekt={objekt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
