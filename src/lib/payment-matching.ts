const STOPWORDS = new Set([
  "familie",
  "herr",
  "frau",
  "dr",
  "und",
  "de",
  "mr",
  "mrs",
  "ms",
  "miete",
  "kaltmiete",
  "warmmiete",
  "wohnung",
]);

export function nameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-zäöüß\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

export type Zahlungskandidat = {
  id: string;
  mieterName: string;
  kaltmiete: number;
  warmmiete: number;
};

/** Ordnet eine Kontobewegung anhand von Namens- und Betragsabgleich genau einem
 * Mietverhältnis zu, sofern das eindeutig möglich ist – sonst null. */
export function findeZahlungsKandidat(
  betrag: number,
  freitext: string,
  kandidaten: Zahlungskandidat[]
): string | null {
  const text = freitext.toLowerCase();
  const toleranz = 5;

  const namensTreffer = kandidaten.filter((k) =>
    nameTokens(k.mieterName).some((token) => text.includes(token))
  );

  if (namensTreffer.length === 1) return namensTreffer[0].id;

  if (namensTreffer.length > 1) {
    const betragsUndNamensTreffer = namensTreffer.filter(
      (k) =>
        Math.abs(betrag - k.warmmiete) < toleranz ||
        Math.abs(betrag - k.kaltmiete) < toleranz
    );
    return betragsUndNamensTreffer.length === 1 ? betragsUndNamensTreffer[0].id : null;
  }

  const betragsTreffer = kandidaten.filter(
    (k) =>
      Math.abs(betrag - k.warmmiete) < toleranz ||
      Math.abs(betrag - k.kaltmiete) < toleranz
  );
  return betragsTreffer.length === 1 ? betragsTreffer[0].id : null;
}

export type Objektkandidat = {
  id: string;
  name: string;
  strasse: string;
  ort: string;
};

function objektTokens(o: Objektkandidat): string[] {
  return [
    ...nameTokens(o.name),
    ...nameTokens(o.strasse.replace(/\d+/g, " ")),
    ...nameTokens(o.ort),
  ];
}

/** Ordnet eine sonstige Zahlung (z.B. Betriebskosten-Ausgabe) anhand von
 * Objektname/Straße/Ort im Freitext eindeutig einem Objekt zu - sonst null. */
export function findeObjektKandidat(
  freitext: string,
  kandidaten: Objektkandidat[]
): string | null {
  const text = freitext.toLowerCase();
  const treffer = kandidaten.filter((o) =>
    objektTokens(o).some((token) => text.includes(token))
  );
  return treffer.length === 1 ? treffer[0].id : null;
}
