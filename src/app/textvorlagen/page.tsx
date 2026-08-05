import { getTextvorlagenGruppiert } from "@/lib/queries";
import { deleteTextvorlage } from "@/lib/actions";
import { DeleteButton } from "@/components/ui/delete-button";
import { CopyButton } from "@/components/copy-button";
import {
  NewTextvorlageButton,
  EditTextvorlageButton,
} from "@/components/forms/textvorlage-form";

export default async function TextvorlagenPage() {
  const gruppen = await getTextvorlagenGruppiert();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Textvorlagen</h1>
          <p className="text-[var(--muted)] text-sm mt-1">
            Wiederkehrende Schreiben griffbereit – z.B. Mahnung, Mieterhöhung,
            Nebenkostenabrechnung
          </p>
        </div>
        <NewTextvorlageButton />
      </div>

      {gruppen.length === 0 ? (
        <div className="card p-8 text-center text-sm text-[var(--muted)]">
          Noch keine Textvorlagen angelegt. Lege Kategorien wie „Mahnung“ oder „Mieterhöhung“ an
          und trage deine eigenen Textbausteine ein.
        </div>
      ) : (
        gruppen.map(({ kategorie, vorlagen }) => (
          <div key={kategorie} className="flex flex-col gap-3">
            <h2 className="font-semibold text-lg">{kategorie}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vorlagen.map((v) => (
                <div key={v.id} className="card p-4 flex flex-col gap-2">
                  <div className="font-semibold">{v.titel}</div>
                  <p className="text-xs text-[var(--muted)] whitespace-pre-line line-clamp-6">
                    {v.inhalt || "Noch kein Inhalt hinterlegt."}
                  </p>
                  {v.notizen && (
                    <p className="text-xs text-[var(--muted)] italic">{v.notizen}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 pt-2 border-t border-[var(--border)]">
                    <CopyButton text={v.inhalt} />
                    <EditTextvorlageButton vorlage={v} />
                    <DeleteButton
                      action={deleteTextvorlage.bind(null, v.id)}
                      confirmText={`Vorlage "${v.titel}" wirklich löschen?`}
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
