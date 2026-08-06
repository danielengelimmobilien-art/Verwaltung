"use client";

import { useState } from "react";
import { zahlungZuordnen } from "@/lib/bank-actions";

const BK_KATEGORIEN = [
  "Hausmeister",
  "Versicherung",
  "Wasser/Abwasser",
  "Strom (Gemeinschaft)",
  "Müllabfuhr",
  "Wartung/Instandhaltung",
  "Grundsteuer",
  "Sonstiges",
];

export function ZuordnenForm({
  kontobewegungId,
  mietverhaeltnisse,
  objekte,
}: {
  kontobewegungId: string;
  mietverhaeltnisse: { id: string; label: string }[];
  objekte: { id: string; name: string }[];
}) {
  const [typ, setTyp] = useState<"miete" | "objekt">("miete");

  return (
    <form
      action={zahlungZuordnen.bind(null, kontobewegungId)}
      className="flex flex-wrap items-center gap-2"
    >
      <select
        value={typ}
        onChange={(e) => setTyp(e.target.value as "miete" | "objekt")}
        className="!py-1 text-xs !w-auto max-w-[130px]"
      >
        <option value="miete">Mietverhältnis</option>
        <option value="objekt">Objekt (Betriebskosten)</option>
      </select>

      {typ === "miete" ? (
        <select name="mietverhaeltnisId" required className="!py-1 text-xs max-w-[220px]">
          <option value="">wählen…</option>
          {mietverhaeltnisse.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      ) : (
        <>
          <select name="objektId" required className="!py-1 text-xs max-w-[160px]">
            <option value="">Objekt wählen…</option>
            {objekte.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <select name="bkKategorie" className="!py-1 text-xs max-w-[170px]">
            {BK_KATEGORIEN.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </>
      )}

      <button
        type="submit"
        className="text-xs font-medium text-[var(--brand)] hover:underline whitespace-nowrap"
      >
        Zuordnen
      </button>
    </form>
  );
}
