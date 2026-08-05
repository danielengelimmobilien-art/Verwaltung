import { getMieterUebersicht } from "@/lib/queries";
import { MieterTable } from "@/components/mieter-table";

export default async function MieterPage() {
  const zeilen = await getMieterUebersicht();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Mieterübersicht</h1>
        <p className="text-[var(--muted)] text-sm mt-1">
          Alle Wohnungen mit Mieter, Einzugstermin, Kaution, Kalt-/Warmmiete und letzter
          Mieterhöhung
        </p>
      </div>
      <MieterTable zeilen={zeilen} />
    </div>
  );
}
