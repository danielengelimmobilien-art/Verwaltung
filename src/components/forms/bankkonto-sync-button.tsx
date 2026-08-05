"use client";

import { useState, useTransition } from "react";
import { synchronisiereBankkonto } from "@/lib/bank-actions";

export function SyncButton({ bankkontoId }: { bankkontoId: string }) {
  const [pending, startTransition] = useTransition();
  const [fehler, setFehler] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => {
          setFehler(null);
          startTransition(async () => {
            try {
              await synchronisiereBankkonto(bankkontoId);
            } catch (err) {
              setFehler(err instanceof Error ? err.message : "Synchronisierung fehlgeschlagen.");
            }
          });
        }}
        disabled={pending}
        className="text-xs font-medium text-[var(--brand)] hover:underline disabled:opacity-50"
      >
        {pending ? "Synchronisiert…" : "Jetzt synchronisieren"}
      </button>
      {fehler && <span className="text-xs text-[var(--bad)] max-w-[200px] text-right">{fehler}</span>}
    </div>
  );
}
