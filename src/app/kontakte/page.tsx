import { getKontakteGruppiert, getObjektListe } from "@/lib/queries";
import { deleteKontakt } from "@/lib/actions";
import { DeleteButton } from "@/components/ui/delete-button";
import { NewKontaktButton, EditKontaktButton } from "@/components/forms/kontakt-form";
import { Badge } from "@/components/ui/badge";

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
                <div key={k.id} className="card p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">{k.name}</div>
                      {k.ansprechpartner && (
                        <div className="text-xs text-[var(--muted)]">
                          {k.ansprechpartner}
                        </div>
                      )}
                    </div>
                    <Badge tone={k.objekt ? "brand" : "neutral"}>
                      {k.objekt ? k.objekt.name : "Portfolioweit"}
                    </Badge>
                  </div>
                  <div className="text-sm flex flex-col gap-0.5">
                    {k.telefon && <div>{k.telefon}</div>}
                    {k.email && <div>{k.email}</div>}
                    {k.adresse && (
                      <div className="text-[var(--muted)]">{k.adresse}</div>
                    )}
                  </div>
                  {k.notizen && (
                    <p className="text-xs text-[var(--muted)]">{k.notizen}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 pt-2 border-t border-[var(--border)]">
                    <EditKontaktButton kontakt={k} objekte={objekte} />
                    <DeleteButton
                      action={deleteKontakt.bind(null, k.id)}
                      confirmText={`Kontakt "${k.name}" wirklich löschen?`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
