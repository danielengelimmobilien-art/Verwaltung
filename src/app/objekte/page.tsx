import { getObjekteMitWohnungen } from "@/lib/queries";
import { ObjektCard } from "@/components/objekt-card";
import { NewObjektButton } from "@/components/forms/objekt-form";

export default async function ObjektePage() {
  const objekte = await getObjekteMitWohnungen();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Objekte</h1>
          <p className="text-[var(--muted)] text-sm mt-1">
            Alle Immobilien im Bestand, {objekte.length} insgesamt
          </p>
        </div>
        <NewObjektButton />
      </div>

      {objekte.length === 0 ? (
        <div className="card p-8 text-center text-sm text-[var(--muted)]">
          Noch keine Objekte angelegt. Lege dein erstes Objekt an, um loszulegen.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {objekte.map((objekt) => (
            <ObjektCard key={objekt.id} objekt={objekt} />
          ))}
        </div>
      )}
    </div>
  );
}
