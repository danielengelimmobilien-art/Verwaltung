import { deleteBeleg } from "@/lib/beleg-actions";
import { formatEuro, formatDatum } from "@/lib/calc";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/ui/delete-button";
import { EditBelegButton } from "@/components/forms/beleg-form";
import { BelegVerknuepfen, BelegVerknuepfungLoesen } from "@/components/forms/beleg-aktionen";
import type { getBelege, getUnverknuepfteKontobewegungen } from "@/lib/queries";

type Beleg = Awaited<ReturnType<typeof getBelege>>[number];

export function BelegTable({
  belege,
  objekte,
  unverknuepfteKontobewegungen,
}: {
  belege: Beleg[];
  objekte: { id: string; name: string }[];
  unverknuepfteKontobewegungen: Awaited<ReturnType<typeof getUnverknuepfteKontobewegungen>>;
}) {
  if (belege.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-[var(--muted)]">
        Noch keine Belege erfasst.
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm min-w-[1000px]">
        <thead>
          <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
            <th className="px-4 py-3 font-semibold">Aussteller</th>
            <th className="px-4 py-3 font-semibold">Rechnungsdatum</th>
            <th className="px-4 py-3 font-semibold">Betrag</th>
            <th className="px-4 py-3 font-semibold">Objekt / Kategorie</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Abgleich</th>
            <th className="px-4 py-3 font-semibold text-right">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {belege.map((b) => (
            <tr key={b.id} className="border-b border-[var(--border)] last:border-0 align-top">
              <td className="px-4 py-3">
                <div className="font-medium">{b.aussteller}</div>
                {b.rechnungsnummer && (
                  <div className="text-xs text-[var(--muted)]">Nr. {b.rechnungsnummer}</div>
                )}
                {b.beschreibung && (
                  <div className="text-xs text-[var(--muted)] max-w-xs">{b.beschreibung}</div>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                {formatDatum(b.rechnungsdatum)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap tabular-nums font-medium">
                {formatEuro(b.betrag)}
              </td>
              <td className="px-4 py-3">
                <div className="text-[var(--muted)]">{b.objekt?.name ?? "–"}</div>
                {b.bkKategorie && (
                  <Badge tone="brand">{b.bkKategorie}</Badge>
                )}
              </td>
              <td className="px-4 py-3">
                <Badge tone={b.status === "bezahlt" ? "good" : "warn"}>
                  {b.status === "bezahlt" ? "Bezahlt" : "Offen"}
                </Badge>
              </td>
              <td className="px-4 py-3 min-w-[220px]">
                {b.kontobewegung ? (
                  <div className="flex flex-col gap-1">
                    <div className="text-xs text-[var(--muted)]">
                      {formatDatum(b.kontobewegung.datum)} · {formatEuro(b.kontobewegung.betrag)}
                      {b.automatischZugeordnet && " · automatisch"}
                    </div>
                    <BelegVerknuepfungLoesen belegId={b.id} />
                  </div>
                ) : (
                  <BelegVerknuepfen
                    belegId={b.id}
                    kontobewegungen={unverknuepfteKontobewegungen}
                  />
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                  <EditBelegButton beleg={b} objekte={objekte} />
                  <DeleteButton
                    action={deleteBeleg.bind(null, b.id)}
                    confirmText={`Beleg von "${b.aussteller}" wirklich löschen?`}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
