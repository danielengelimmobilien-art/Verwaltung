import { notFound } from "next/navigation";
import Link from "next/link";
import { getObjektMitWohnungen } from "@/lib/queries";
import { deleteObjekt, deleteWohnung } from "@/lib/actions";
import {
  formatEuro,
  formatQm,
  formatDatum,
  formatProzent,
  performanceLevel,
} from "@/lib/calc";
import { StatCard } from "@/components/ui/stat-card";
import { PerformanceBadge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/ui/delete-button";
import { RentComparisonChart } from "@/components/charts/rent-comparison-chart";
import { EditObjektButton } from "@/components/forms/objekt-form";
import { NewWohnungButton, EditWohnungButton } from "@/components/forms/wohnung-form";
import {
  NewMietverhaeltnisButton,
  EditMietverhaeltnisButton,
  EndMietverhaeltnisButton,
} from "@/components/forms/mietverhaeltnis-form";
import { NewMieterhoehungButton } from "@/components/forms/mieterhoehung-form";

const levelLabels = {
  gut: "Auf Zielkurs",
  beobachten: "Beobachten",
  kritisch: "Unter Ziel",
  unbekannt: "Kein Ziel gesetzt",
};

export default async function ObjektDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const objekt = await getObjektMitWohnungen(id);
  if (!objekt) notFound();

  const gesamtLevel = performanceLevel(objekt.kennzahlen.abweichungProzent);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--muted)] mb-1">
            <Link href="/objekte" className="hover:underline">
              Objekte
            </Link>
            <span>/</span>
            <span>{objekt.name}</span>
          </div>
          <h1 className="text-2xl font-bold">{objekt.name}</h1>
          <p className="text-[var(--muted)] text-sm mt-1">
            {objekt.strasse}, {objekt.plz} {objekt.ort}
            {objekt.baujahr ? ` · Baujahr ${objekt.baujahr}` : ""}
          </p>
          {objekt.lage && (
            <p className="text-sm mt-2 max-w-2xl">{objekt.lage}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <EditObjektButton objekt={objekt} />
          <DeleteButton
            action={deleteObjekt.bind(null, objekt.id)}
            confirmText={`"${objekt.name}" inkl. aller Wohnungen, Mietverhältnisse und Sanierungen wirklich löschen?`}
            className="px-3.5 py-2 rounded-lg border border-[var(--border)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Nettokaltmiete gesamt"
          value={formatEuro(objekt.kennzahlen.gesamtKaltmiete)}
        />
        <StatCard
          label="Ø Miete / m²"
          value={`${objekt.kennzahlen.istProQmSchnitt.toFixed(2)} €`}
          hint={`Ziel: ${objekt.kennzahlen.zielProQmSchnitt.toFixed(2)} €/m² (${formatProzent(
            objekt.kennzahlen.abweichungProzent
          )})`}
          tone={gesamtLevel === "kritisch" ? "bad" : gesamtLevel === "beobachten" ? "warn" : "good"}
        />
        <StatCard
          label="Cashflow / Monat"
          value={formatEuro(objekt.kennzahlen.cashflowMonatlich)}
          hint={`Bankrate: ${formatEuro(objekt.bankrateMonatlich)}`}
          tone={objekt.kennzahlen.cashflowMonatlich >= 0 ? "good" : "bad"}
        />
        <StatCard
          label="Vermietungsquote"
          value={`${
            objekt.kennzahlen.anzahlWohnungen
              ? Math.round(
                  (objekt.kennzahlen.anzahlVermietet / objekt.kennzahlen.anzahlWohnungen) * 100
                )
              : 0
          } %`}
          hint={`${objekt.kennzahlen.anzahlVermietet}/${objekt.kennzahlen.anzahlWohnungen} Wohnungen`}
        />
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-4">
        <div className="card p-5">
          <h2 className="font-semibold mb-1">Miete/m² je Wohnung: Ist vs. Ziel</h2>
          <p className="text-xs text-[var(--muted)] mb-4">
            {objekt.wohnungen.length} Wohnungen in diesem Objekt
          </p>
          <RentComparisonChart
            data={objekt.wohnungen.map((w) => ({
              name: w.bezeichnung,
              ist: Number(w.istProQm.toFixed(2)),
              ziel: Number((w.zielmieteProQm ?? 0).toFixed(2)),
            }))}
          />
        </div>
        <div className="card p-5 flex flex-col gap-3">
          <h2 className="font-semibold">Finanzierung</h2>
          <dl className="text-sm flex flex-col gap-2">
            <Row label="Bank" value={objekt.bankName ?? "–"} />
            <Row label="Kaufpreis" value={formatEuro(objekt.kaufpreis)} />
            <Row label="Kaufdatum" value={formatDatum(objekt.kaufdatum)} />
            <Row label="Darlehenssumme" value={formatEuro(objekt.darlehenssumme)} />
            <Row
              label="Zinssatz"
              value={objekt.zinssatzProzent ? `${objekt.zinssatzProzent} % p.a.` : "–"}
            />
            <Row
              label="Tilgung"
              value={objekt.tilgungProzent ? `${objekt.tilgungProzent} % p.a.` : "–"}
            />
            <Row
              label="Bankrate / Monat"
              value={formatEuro(objekt.bankrateMonatlich)}
            />
          </dl>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Wohnungen</h2>
          <NewWohnungButton objektId={objekt.id} />
        </div>

        {objekt.wohnungen.length === 0 ? (
          <div className="card p-8 text-center text-sm text-[var(--muted)]">
            Noch keine Wohnungen in diesem Objekt angelegt.
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
                  <th className="px-4 py-3 font-semibold">Wohnung</th>
                  <th className="px-4 py-3 font-semibold">Lage im Objekt</th>
                  <th className="px-4 py-3 font-semibold">Größe</th>
                  <th className="px-4 py-3 font-semibold">Miete/m² (Ist)</th>
                  <th className="px-4 py-3 font-semibold">Zielmiete/m²</th>
                  <th className="px-4 py-3 font-semibold">Performance</th>
                  <th className="px-4 py-3 font-semibold">Mieter</th>
                  <th className="px-4 py-3 font-semibold text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {objekt.wohnungen.map((wohnung) => {
                  const level = wohnung.vermietet
                    ? performanceLevel(wohnung.abweichungProzent)
                    : "unbekannt";
                  return (
                    <tr key={wohnung.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-4 py-3 font-medium">{wohnung.bezeichnung}</td>
                      <td className="px-4 py-3 text-[var(--muted)]">{wohnung.lageImObjekt}</td>
                      <td className="px-4 py-3 tabular-nums">{formatQm(wohnung.groesseQm)}</td>
                      <td className="px-4 py-3 tabular-nums">
                        {wohnung.vermietet ? `${wohnung.istProQm.toFixed(2)} €` : "–"}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-[var(--muted)]">
                        {wohnung.zielmieteProQm ? `${wohnung.zielmieteProQm.toFixed(2)} €` : "–"}
                      </td>
                      <td className="px-4 py-3">
                        <PerformanceBadge
                          level={level}
                          label={wohnung.vermietet ? levelLabels[level] : "Leerstand"}
                        />
                      </td>
                      <td className="px-4 py-3">
                        {wohnung.aktuellesMietverhaeltnis ? (
                          <div>
                            <div className="font-medium">
                              {wohnung.aktuellesMietverhaeltnis.mieterName}
                            </div>
                            <div className="text-xs text-[var(--muted)]">
                              seit {formatDatum(wohnung.aktuellesMietverhaeltnis.einzugsdatum)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[var(--muted)]">unvermietet</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                          <EditWohnungButton wohnung={wohnung} />
                          {wohnung.aktuellesMietverhaeltnis ? (
                            <>
                              <NewMieterhoehungButton
                                mietverhaeltnisId={wohnung.aktuellesMietverhaeltnis.id}
                                objektId={objekt.id}
                                aktuelleKaltmiete={wohnung.kaltmiete}
                              />
                              <EditMietverhaeltnisButton
                                mv={wohnung.aktuellesMietverhaeltnis}
                                objektId={objekt.id}
                              />
                              <EndMietverhaeltnisButton
                                mv={wohnung.aktuellesMietverhaeltnis}
                                objektId={objekt.id}
                              />
                            </>
                          ) : (
                            <NewMietverhaeltnisButton
                              wohnungId={wohnung.id}
                              objektId={objekt.id}
                            />
                          )}
                          <DeleteButton
                            action={deleteWohnung.bind(null, wohnung.id, objekt.id)}
                            confirmText={`Wohnung "${wohnung.bezeichnung}" wirklich löschen?`}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">
          Sanierungs- und Modernisierungsmaßnahmen dieses Objekts:
        </p>
        <Link
          href={`/sanierung#${objekt.id}`}
          className="text-sm text-[var(--brand)] font-medium"
        >
          Zur Sanierungsübersicht →
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="font-medium tabular-nums text-right">{value}</dd>
    </div>
  );
}
