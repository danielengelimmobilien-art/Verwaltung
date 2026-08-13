import { PDFParse } from "pdf-parse";

export async function extrahiereTextAusPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

export type ExtrahierteBuchung = {
  datum: Date;
  betrag: number;
  vorzeichenErkannt: boolean;
  verwendungszweck: string;
  zeile: string;
};

const DATUM_MUSTER = /^(\d{2})\.(\d{2})\.(\d{2,4})\.?\s*/;
// Nur "." als Tausendertrennzeichen (deutsche Konvention) - ein Leerzeichen
// davor würde sonst versehentlich vorangehende Ziffern (z.B. aus einer
// Rechnungs-/Referenznummer direkt vor dem Betrag) mit in den Betrag ziehen.
const BETRAG_MUSTER = /([+-])?\s*(\d{1,3}(?:\.\d{3})*,\d{2})\s*(EUR)?\s*([+-]|\bS\b|\bH\b)?\s*$/i;
const SEITENTRENNER_MUSTER = /^--\s*\d+\s*of\s*\d+\s*--$/i;

/**
 * Heuristische Extraktion von Buchungen aus dem per PDF-Textauszug gewonnenen
 * Rohtext eines Kontoauszugs. Erwartet pro Zeile grob "Datum ... Text ...
 * Betrag[+/-]" - deckt damit die meisten deutschen Kontoauszug-PDFs ab, aber
 * nicht jedes Bankformat. Ergebnisse sind zur Kontrolle durch den Nutzer
 * gedacht, nicht zur blinden Übernahme.
 */
export function parseKontoauszugText(text: string): ExtrahierteBuchung[] {
  const zeilen = text
    .split(/\r?\n/)
    .map((z) => z.trim())
    .filter((z) => z.length > 0 && !SEITENTRENNER_MUSTER.test(z));

  const buchungen: ExtrahierteBuchung[] = [];

  for (const zeile of zeilen) {
    const datumMatch = zeile.match(DATUM_MUSTER);
    if (!datumMatch) continue;

    const rest = zeile.slice(datumMatch[0].length);
    const betragMatch = rest.match(BETRAG_MUSTER);
    if (!betragMatch) continue;

    const [, tag, monat, jahrRoh] = datumMatch;
    const jahr = jahrRoh.length === 2 ? 2000 + Number(jahrRoh) : Number(jahrRoh);
    const datum = new Date(jahr, Number(monat) - 1, Number(tag));
    if (Number.isNaN(datum.getTime())) continue;

    const betragText = betragMatch[2].replace(/[.\s]/g, "").replace(",", ".");
    let betrag = Number(betragText);
    if (!Number.isFinite(betrag)) continue;

    const vorzeichenRoh = (betragMatch[1] ?? betragMatch[4] ?? "").toUpperCase();
    const vorzeichenErkannt = vorzeichenRoh !== "";
    if (vorzeichenRoh === "-" || vorzeichenRoh === "S") {
      betrag = -Math.abs(betrag);
    } else if (vorzeichenRoh === "+" || vorzeichenRoh === "H") {
      betrag = Math.abs(betrag);
    }

    const verwendungszweck = rest.slice(0, betragMatch.index).trim();

    buchungen.push({
      datum,
      betrag,
      vorzeichenErkannt,
      verwendungszweck: verwendungszweck || zeile,
      zeile,
    });
  }

  return buchungen;
}
