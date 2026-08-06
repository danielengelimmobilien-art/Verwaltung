import { deleteSanierung } from "@/lib/actions";
import { formatEuro, formatDatum } from "@/lib/calc";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/ui/delete-button";
import { EditSanierungButton } from "@/components/forms/sanierung-form";
import type { Sanierung } from "@/generated/prisma/client";

export function SanierungTable({
  sanierungen,
  objektId,
}: {
  sanierungen: Sanierung[];
  objektId: string;
}) {
  if (sanierungen.length === 0) {
    return (
      <div className="card p-6 text-sm text-[var(--muted)]">Keine Maßnahmen erfasst.</div>
    );
  }

  return (
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
                  <div className="text-xs text-[var(--muted)] max-w-xs">{s.beschreibung}</div>
                )}
              </td>
              <td className="px-4 py-3">
                <Badge tone="brand">{s.kategorie}</Badge>
              </td>
              <td className="px-4 py-3 whitespace-nowrap tabular-nums">{formatDatum(s.datum)}</td>
              <td className="px-4 py-3 whitespace-nowrap tabular-nums">{formatEuro(s.kosten)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={s.status} />
              </td>
              <td className="px-4 py-3 text-xs text-[var(--muted)] max-w-[180px]">
                {s.belegHinweis ?? "–"}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                  <EditSanierungButton sanierung={s} objektId={objektId} />
                  <DeleteButton
                    action={deleteSanierung.bind(null, s.id, objektId)}
                    confirmText={`Maßnahme "${s.titel}" wirklich löschen?`}
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
