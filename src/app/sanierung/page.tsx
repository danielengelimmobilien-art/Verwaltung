import { getSanierungenNachObjekt } from "@/lib/queries";
import { formatEuro } from "@/lib/calc";
import { NewSanierungButton } from "@/components/forms/sanierung-form";
import { SanierungTable } from "@/components/sanierung-table";

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

            <SanierungTable sanierungen={sanierungen} objektId={objekt.id} />
          </div>
        ))
      )}
    </div>
  );
}
