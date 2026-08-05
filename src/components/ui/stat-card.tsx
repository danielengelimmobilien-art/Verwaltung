import { clsx } from "clsx";
import type { ReactNode } from "react";

const toneStyles: Record<string, { text: string; bg: string }> = {
  neutral: { text: "text-[var(--foreground)]", bg: "bg-[var(--surface-muted)] text-[var(--muted)]" },
  good: { text: "text-[var(--good)]", bg: "bg-[var(--good-soft)] text-[var(--good)]" },
  warn: { text: "text-[var(--warn)]", bg: "bg-[var(--warn-soft)] text-[var(--warn)]" },
  bad: { text: "text-[var(--bad)]", bg: "bg-[var(--bad-soft)] text-[var(--bad)]" },
};

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "good" | "warn" | "bad";
  icon?: ReactNode;
}) {
  const t = toneStyles[tone];

  return (
    <div className="card p-4 sm:p-5 flex items-start gap-3.5">
      {icon && (
        <div
          className={clsx(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            t.bg
          )}
        >
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          {label}
        </span>
        <span className={clsx("text-2xl font-bold tabular-nums", t.text)}>{value}</span>
        {hint && <span className="text-xs text-[var(--muted)]">{hint}</span>}
      </div>
    </div>
  );
}
