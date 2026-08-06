import { getKontakteGruppiert, getObjektListe } from "@/lib/queries";
import { NewKontaktButton } from "@/components/forms/kontakt-form";
import { KontaktCard } from "@/components/kontakt-card";

export default async function KontaktePage() {
  const [gruppen, objekte] = await Promise.all([
    getKontakteGruppiert(),
    getObjektListe(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Kontakte</h1>
          <p className="text-[var(--muted)] text-sm mt-1">
            Gewerke, Dienstleister und Verwaltungen – portfolioweit oder für ein
            bestimmtes Objekt
          </p>
        </div>
        <NewKontaktButton objekte={objekte} />
      </div>

      {gruppen.length === 0 ? (
        <div className="card p-8 text-center text-sm text-[var(--muted)]">
          Noch keine Kontakte angelegt.
        </div>
      ) : (
        gruppen.map(({ kategorie, kontakte }) => (
          <div key={kategorie} className="flex flex-col gap-3">
            <h2 className="font-semibold text-lg">{kategorie}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {kontakte.map((k) => (
                <KontaktCard key={k.id} kontakt={k} objekte={objekte} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
