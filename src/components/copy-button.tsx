"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [kopiert, setKopiert] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setKopiert(true);
          setTimeout(() => setKopiert(false), 1500);
        } catch {
          // Zwischenablage evtl. nicht verfügbar (z.B. kein HTTPS) – stillschweigend ignorieren
        }
      }}
      className="text-xs font-medium text-[var(--brand)] hover:underline"
    >
      {kopiert ? "Kopiert ✓" : "Kopieren"}
    </button>
  );
}
