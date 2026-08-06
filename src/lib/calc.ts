export function mieteProQm(kaltmiete: number, groesseQm: number): number {
  if (!groesseQm) return 0;
  return kaltmiete / groesseQm;
}

/** Abweichung der Ist-Miete/qm von der Zielmiete/qm in Prozent (positiv = über Ziel) */
export function zielAbweichungProzent(
  istProQm: number,
  zielProQm: number | null | undefined
): number | null {
  if (!zielProQm) return null;
  return ((istProQm - zielProQm) / zielProQm) * 100;
}

export function warmmiete(
  kaltmiete: number,
  betriebskosten: number | null | undefined,
  heizkosten: number | null | undefined
): number {
  return kaltmiete + (betriebskosten ?? 0) + (heizkosten ?? 0);
}

export function formatEuro(value: number | null | undefined): string {
  if (value === null || value === undefined) return "–";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatQm(value: number | null | undefined): string {
  if (value === null || value === undefined) return "–";
  return `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(value)} m²`;
}

export function formatDatum(value: Date | string | null | undefined): string {
  if (!value) return "–";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(d);
}

export function formatProzent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "–";
  const sign = value > 0 ? "+" : "";
  return `${sign}${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(value)} %`;
}

export function formatMonat(jahr: number, monatNullbasiert: number): string {
  const d = new Date(jahr, monatNullbasiert, 1);
  return new Intl.DateTimeFormat("de-DE", { month: "short", year: "numeric" }).format(d);
}

export function maskeIban(iban: string | null | undefined): string {
  if (!iban) return "–";
  const bereinigt = iban.replace(/\s/g, "");
  return `•••• ${bereinigt.slice(-4)}`;
}

/**
 * Performance-Ampel je nach Abweichung der Ist- von der Zielmiete:
 * mehr als 30 % unter Ziel = kritisch (rot), mehr als 15 % unter Ziel =
 * beobachten (gelb), sonst gut (grün).
 */
export function performanceLevel(
  abweichungProzent: number | null
): "gut" | "beobachten" | "kritisch" | "unbekannt" {
  if (abweichungProzent === null) return "unbekannt";
  if (abweichungProzent < -30) return "kritisch";
  if (abweichungProzent < -15) return "beobachten";
  return "gut";
}

/** Farbe (CSS-Variable) für die Ist-Miete-Balken in Diagrammen, je Performance-Level */
export function performanceFarbe(abweichungProzent: number | null): string {
  const level = performanceLevel(abweichungProzent);
  if (level === "kritisch") return "var(--bad)";
  if (level === "beobachten") return "var(--warn)";
  if (level === "gut") return "var(--good)";
  return "var(--muted)";
}
