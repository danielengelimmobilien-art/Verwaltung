import { clsx } from "clsx";

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const toneStyles: Record<string, string> = {
    neutral: "text-[var(--foreground)]",
    good: "text-[var(--good)]",
    warn: "text-[var(--warn)]",
    bad: "text-[var(--bad)]",
  };

  return (
    <div className="card p-4 sm:p-5 flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </span>
      <span className={clsx("text-2xl font-bold tabular-nums", toneStyles[tone])}>
        {value}
      </span>
      {hint && <span className="text-xs text-[var(--muted)]">{hint}</span>}
    </div>
  );
}
