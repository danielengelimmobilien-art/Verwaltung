"use client";

import { useState, useTransition } from "react";
import {
  belegManuellVerknuepfen,
  belegVerknuepfungAufheben,
  belegStatusUmschalten,
} from "@/lib/beleg-actions";

export function BelegVerknuepfen({
  belegId,
  kontobewegungen,
}: {
  belegId: string;
  kontobewegungen: { id: string; label: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [fehler, setFehler] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <form
        action={(formData) => {
          setFehler(null);
          startTransition(async () => {
            try {
              await belegManuellVerknuepfen(belegId, formData);
            } catch (err) {
              setFehler(err instanceof Error ? err.message : "Verknüpfung fehlgeschlagen.");
            }
          });
        }}
        className="flex items-center gap-2"
      >
        <select name="kontobewegungId" required className="!py-1 text-xs max-w-[240px]">
          <option value="">Buchung wählen…</option>
          {kontobewegungen.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="text-xs font-medium text-[var(--brand)] hover:underline whitespace-nowrap disabled:opacity-50"
        >
          Verknüpfen
        </button>
      </form>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => belegStatusUmschalten(belegId))}
        className="text-xs font-medium text-[var(--muted)] hover:underline text-left disabled:opacity-50"
      >
        oder ohne Buchung als bezahlt markieren
      </button>
      {fehler && <p className="text-xs text-[var(--bad)]">{fehler}</p>}
    </div>
  );
}

export function BelegVerknuepfungLoesen({ belegId }: { belegId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => belegVerknuepfungAufheben(belegId))}
      className="text-xs font-medium text-[var(--muted)] hover:underline disabled:opacity-50"
    >
      {pending ? "…" : "Verknüpfung lösen"}
    </button>
  );
}
