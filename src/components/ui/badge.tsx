import { clsx } from "clsx";
import type { performanceLevel } from "@/lib/calc";

const levelStyles: Record<ReturnType<typeof performanceLevel>, string> = {
  gut: "bg-[var(--good-soft)] text-[var(--good)]",
  beobachten: "bg-[var(--warn-soft)] text-[var(--warn)]",
  kritisch: "bg-[var(--bad-soft)] text-[var(--bad)]",
  unbekannt: "bg-[var(--surface-muted)] text-[var(--muted)]",
};

export function PerformanceBadge({
  level,
  label,
}: {
  level: ReturnType<typeof performanceLevel>;
  label: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        levelStyles[level]
      )}
    >
      {label}
    </span>
  );
}

const statusStyles: Record<string, string> = {
  geplant: "bg-[var(--surface-muted)] text-[var(--muted)]",
  in_arbeit: "bg-[var(--warn-soft)] text-[var(--warn)]",
  abgeschlossen: "bg-[var(--good-soft)] text-[var(--good)]",
};

const statusLabels: Record<string, string> = {
  geplant: "Geplant",
  in_arbeit: "In Arbeit",
  abgeschlossen: "Abgeschlossen",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        statusStyles[status] ?? statusStyles.geplant
      )}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}

const zahlungsStyles: Record<string, string> = {
  bezahlt: "bg-[var(--good-soft)] text-[var(--good)]",
  teilweise: "bg-[var(--warn-soft)] text-[var(--warn)]",
  fehlt: "bg-[var(--bad-soft)] text-[var(--bad)]",
  nicht_ueberwacht: "bg-[var(--surface-muted)] text-[var(--muted)]",
};

const zahlungsLabels: Record<string, string> = {
  bezahlt: "Bezahlt",
  teilweise: "Teilweise",
  fehlt: "Fehlt",
  nicht_ueberwacht: "Nicht überwacht",
};

export function ZahlungsBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        zahlungsStyles[status] ?? zahlungsStyles.nicht_ueberwacht
      )}
    >
      {zahlungsLabels[status] ?? status}
    </span>
  );
}

const kontoStatusStyles: Record<string, string> = {
  ausstehend: "bg-[var(--warn-soft)] text-[var(--warn)]",
  verbunden: "bg-[var(--good-soft)] text-[var(--good)]",
  fehler: "bg-[var(--bad-soft)] text-[var(--bad)]",
};

const kontoStatusLabels: Record<string, string> = {
  ausstehend: "Ausstehend",
  verbunden: "Verbunden",
  fehler: "Fehler",
};

export function KontoStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        kontoStatusStyles[status] ?? kontoStatusStyles.ausstehend
      )}
    >
      {kontoStatusLabels[status] ?? status}
    </span>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "brand";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-[var(--surface-muted)] text-[var(--muted)]",
    good: "bg-[var(--good-soft)] text-[var(--good)]",
    warn: "bg-[var(--warn-soft)] text-[var(--warn)]",
    bad: "bg-[var(--bad-soft)] text-[var(--bad)]",
    brand: "bg-[var(--brand-soft)] text-[var(--brand-strong)]",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}
