import { getSanierungenNachObjekt } from "@/lib/queries";
import { deleteSanierung } from "@/lib/actions";
import { formatEuro, formatDatum } from "@/lib/calc";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/ui/delete-button";
import { NewSanierungButton, EditSanierungButton } from "@/components/forms/sanierung-form";

export default async function SanierungPage() {
  const gruppen = await getSanierungenNachObjekt();
  const gesamtKosten = gruppen.reduce((s, g) => s + g.summeKosten, 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Sanierung &amp; Modernisierung</h1>
          <p className="text-[var(--muted)] text-sm mt-1">
            Maßnahmen je Objekt, Gesamtkosten bisher: {formatEuro(gesamtKosten)}
          </p>
        </div>
      </div>

      <div className="card p-4 text-sm text-[var(--muted)] bg-[var(--brand-soft)] border-[var(--brand-soft)]">
        Hinweis: Belege und Unterlagen aus deinen lokalen Ordnern können hier nicht automatisch
        eingelesen werden (diese Sitzung läuft in der Cloud, ohne Zugriff auf deinen Laptop).
        Trage Maßnahmen manuell ein und hinterlege bei Bedarf einen Ablage-Hinweis. Wenn du
        Claude Code lokal auf deinem Rechner nutzt, kann eine automatische Auswertung deiner
        Ordner ergänzt werden.
      </div>

      {gruppen.length === 0 ? (
        <div className="card p-8 text-center text-sm text-[var(--muted)]">
          Noch keine Objekte angelegt.
        </div>
      ) : (
        gruppen.map(({ objekt, sanierungen, summeKosten }) => (
          <div key={objekt.id} id={objekt.id} className="flex flex-col gap-3 scroll-mt-20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-lg">{objekt.name}</h2>
                <p className="text-xs text-[var(--muted)]">
                  {objekt.strasse}, {objekt.plz} {objekt.ort} · Kosten bisher:{" "}
                  {formatEuro(summeKosten)}
                </p>
              </div>
              <NewSanierungButton objektId={objekt.id} />
            </div>

            {sanierungen.length === 0 ? (
              <div className="card p-6 text-sm text-[var(--muted)]">
                Keine Maßnahmen erfasst.
              </div>
            ) : (
              <div className="card overflow-x-auto">
                <table className="w-full text-sm min-w-[800px]">
                  <thead>
                    <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
                      <th className="px-4 py-3 font-semibold">Maßnahme</th>
                      <th className="px-4 py-3 font-semibold">Kategorie</th>
                      <th className="px-4 py-3 font-semibold">Datum</th>
                      <th className="px-4 py-3 font-semibold">Kosten</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Ablage</th>
                      <th className="px-4 py-3 font-semibold text-right">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sanierungen.map((s) => (
                      <tr key={s.id} className="border-b border-[var(--border)] last:border-0 align-top">
                        <td className="px-4 py-3">
                          <div className="font-medium">{s.titel}</div>
                          {s.beschreibung && (
                            <div className="text-xs text-[var(--muted)] max-w-xs">
                              {s.beschreibung}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone="brand">{s.kategorie}</Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                          {formatDatum(s.datum)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                          {formatEuro(s.kosten)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={s.status} />
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--muted)] max-w-[180px]">
                          {s.belegHinweis ?? "–"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                            <EditSanierungButton sanierung={s} objektId={objekt.id} />
                            <DeleteButton
                              action={deleteSanierung.bind(null, s.id, objekt.id)}
                              confirmText={`Maßnahme "${s.titel}" wirklich löschen?`}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
