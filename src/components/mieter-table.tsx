"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatEuro, formatDatum } from "@/lib/calc";
import {
  NewMietverhaeltnisButton,
  EditMietverhaeltnisButton,
  EndMietverhaeltnisButton,
} from "@/components/forms/mietverhaeltnis-form";
import { NewMieterhoehungButton } from "@/components/forms/mieterhoehung-form";
import type { getMieterUebersicht } from "@/lib/queries";

type Zeile = Awaited<ReturnType<typeof getMieterUebersicht>>[number];

export function MieterTable({ zeilen }: { zeilen: Zeile[] }) {
  const [query, setQuery] = useState("");

  const gefiltert = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return zeilen;
    return zeilen.filter((z) =>
      [
        z.objekt.name,
        z.objekt.ort,
        z.wohnung.bezeichnung,
        z.wohnung.lageImObjekt,
        z.mietverhaeltnis?.mieterName ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [zeilen, query]);

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        placeholder="Suche nach Objekt, Wohnung oder Mieter…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead>
            <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
              <th className="px-4 py-3 font-semibold">Objekt</th>
              <th className="px-4 py-3 font-semibold">Wohnung / Lage im Objekt</th>
              <th className="px-4 py-3 font-semibold">Mieter</th>
              <th className="px-4 py-3 font-semibold">Einzug</th>
              <th className="px-4 py-3 font-semibold">Kaution</th>
              <th className="px-4 py-3 font-semibold">Kaltmiete</th>
              <th className="px-4 py-3 font-semibold">Betriebskosten</th>
              <th className="px-4 py-3 font-semibold">Heizkosten</th>
              <th className="px-4 py-3 font-semibold">Warmmiete</th>
              <th className="px-4 py-3 font-semibold">Letzte Mieterhöhung</th>
              <th className="px-4 py-3 font-semibold text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {gefiltert.map((z) => (
              <tr key={z.wohnung.id} className="border-b border-[var(--border)] last:border-0 align-top">
                <td className="px-4 py-3">
                  <Link href={`/objekte/${z.objekt.id}`} className="font-medium hover:text-[var(--brand)]">
                    {z.objekt.name}
                  </Link>
                  <div className="text-xs text-[var(--muted)]">{z.objekt.ort}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{z.wohnung.bezeichnung}</div>
                  <div className="text-xs text-[var(--muted)]">{z.wohnung.lageImObjekt}</div>
                </td>
                <td className="px-4 py-3">
                  {z.mietverhaeltnis ? (
                    z.mietverhaeltnis.mieterName
                  ) : (
                    <span className="text-[var(--muted)]">unvermietet</span>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                  {z.mietverhaeltnis ? formatDatum(z.mietverhaeltnis.einzugsdatum) : "–"}
                </td>
                <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                  {z.mietverhaeltnis ? formatEuro(z.mietverhaeltnis.kaution) : "–"}
                </td>
                <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                  {z.mietverhaeltnis ? formatEuro(z.mietverhaeltnis.kaltmiete) : "–"}
                </td>
                <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                  {z.mietverhaeltnis
                    ? formatEuro(z.mietverhaeltnis.betriebskostenVorauszahlung)
                    : "–"}
                </td>
                <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                  {z.mietverhaeltnis
                    ? formatEuro(z.mietverhaeltnis.heizkostenVorauszahlung)
                    : "–"}
                </td>
                <td className="px-4 py-3 tabular-nums whitespace-nowrap font-semibold">
                  {z.warmmiete !== null ? formatEuro(z.warmmiete) : "–"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {z.letzteMieterhoehung ? (
                    <div>
                      <div className="tabular-nums">
                        {formatEuro(z.letzteMieterhoehung.neueKaltmiete)}
                      </div>
                      <div className="text-xs text-[var(--muted)]">
                        {formatDatum(z.letzteMieterhoehung.datum)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[var(--muted)]">–</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                    {z.mietverhaeltnis ? (
                      <>
                        <NewMieterhoehungButton
                          mietverhaeltnisId={z.mietverhaeltnis.id}
                          objektId={z.objekt.id}
                          aktuelleKaltmiete={z.mietverhaeltnis.kaltmiete}
                        />
                        <EditMietverhaeltnisButton
                          mv={z.mietverhaeltnis}
                          objektId={z.objekt.id}
                        />
                        <EndMietverhaeltnisButton
                          mv={z.mietverhaeltnis}
                          objektId={z.objekt.id}
                        />
                      </>
                    ) : (
                      <NewMietverhaeltnisButton
                        wohnungId={z.wohnung.id}
                        objektId={z.objekt.id}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {gefiltert.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-[var(--muted)]">
                  Keine Treffer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
