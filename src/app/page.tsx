import Link from "next/link";
import { getPortfolioKennzahlen } from "@/lib/queries";
import { formatEuro } from "@/lib/calc";
import { StatCard } from "@/components/ui/stat-card";
import { EuroIcon, TrendUpIcon, HomeIcon } from "@/components/ui/icons";
import { ObjektCard } from "@/components/objekt-card";
import { RentBrowserChart } from "@/components/charts/rent-browser-chart";
import { CashflowBrowserChart } from "@/components/charts/cashflow-browser-chart";

export default async function DashboardPage() {
  const kpi = await getPortfolioKennzahlen();
  const vermietungsquote = kpi.anzahlWohnungen
    ? Math.round((kpi.anzahlVermietet / kpi.anzahlWohnungen) * 100)
    : 0;
  const leerstandProzent = kpi.anzahlWohnungen
    ? ((kpi.anzahlWohnungen - kpi.anzahlVermietet) / kpi.anzahlWohnungen) * 100
    : 0;
  const leerstandKritisch = leerstandProzent > 5;

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
          className="text-sm font-medium px-4 py-2 rounded-lg btn-primary w-fit"
        >
          + Neues Objekt
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Nettokaltmiete gesamt / Monat"
          value={formatEuro(kpi.gesamtKaltmiete)}
          hint={`${kpi.anzahlVermietet}/${kpi.anzahlWohnungen} Einheiten vermietet`}
          icon={<EuroIcon />}
        />
        <StatCard
          label="Cashflow / Monat"
          value={formatEuro(kpi.cashflowMonatlich)}
          hint={`Bankrate gesamt: ${formatEuro(kpi.gesamtBankrate)}`}
          tone={kpi.cashflowMonatlich >= 0 ? "good" : "bad"}
          icon={<TrendUpIcon />}
        />
        <StatCard
          label="Vermietungsquote"
          value={`${vermietungsquote} %`}
          hint={
            leerstandKritisch
              ? `Leerstand ${leerstandProzent.toFixed(0)} % (${
                  kpi.anzahlWohnungen - kpi.anzahlVermietet
                } von ${kpi.anzahlWohnungen} Wohnungen)`
              : `${kpi.anzahlVermietet} von ${kpi.anzahlWohnungen} Wohnungen`
          }
          tone={leerstandKritisch ? "bad" : "neutral"}
          icon={<HomeIcon />}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <CashflowBrowserChart
          objekte={kpi.objekte.map((o) => ({
            id: o.id,
            name: o.name,
            miete: Math.round(o.kennzahlen.gesamtKaltmiete),
            bankrate: Math.round(o.bankrateMonatlich ?? 0),
          }))}
        />
        <RentBrowserChart
          objekte={kpi.objekte.map((o) => ({
            id: o.id,
            name: o.name,
            ist: Number(o.kennzahlen.istProQmSchnitt.toFixed(2)),
            ziel: Number(o.kennzahlen.zielProQmSchnitt.toFixed(2)),
            wohnungen: o.wohnungen.map((w) => ({
              name: w.bezeichnung,
              ist: Number(w.istProQm.toFixed(2)),
              ziel: Number((w.zielmieteProQm ?? 0).toFixed(2)),
            })),
          }))}
        />
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
