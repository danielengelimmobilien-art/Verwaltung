"use client";

export function ChartNav({
  objekte,
  scope,
  onChange,
}: {
  objekte: { id: string; name: string }[];
  scope: string;
  onChange: (value: string) => void;
}) {
  const options = [{ id: "alle", name: "Alle Objekte (Zusammenfassung)" }, ...objekte];
  const index = options.findIndex((o) => o.id === scope);

  function step(delta: number) {
    const next = options[(index + delta + options.length) % options.length];
    onChange(next.id);
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={() => step(-1)}
        aria-label="Vorheriges Objekt"
        className="h-7 w-7 flex items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
      >
        ‹
      </button>
      <select
        value={scope}
        onChange={(e) => onChange(e.target.value)}
        className="!w-auto !py-1 text-xs max-w-[160px]"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => step(1)}
        aria-label="Nächstes Objekt"
        className="h-7 w-7 flex items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
      >
        ›
      </button>
    </div>
  );
}
