// Heuristische Extraktion von Kerndaten aus Rechnungs-/Beleg-PDFs. Anders als
// Kontoauszüge folgen Rechnungen keinem einheitlichen Zeilenformat, daher wird
// hier im gesamten Text nach typischen Signalwörtern gesucht. Das Ergebnis ist
// ein Vorschlag zur Kontrolle durch den Nutzer, keine verlässliche Extraktion.

export type ErkannteRechnung = {
  aussteller: string | null;
  rechnungsnummer: string | null;
  rechnungsdatum: string | null; // YYYY-MM-DD
  betrag: number | null;
};

function parseGermanAmount(raw: string): number {
  return Number(raw.replace(/\./g, "").replace(",", "."));
}

function normalisiereDatum(tag: string, monat: string, jahrRoh: string): string | null {
  const jahr = jahrRoh.length === 2 ? 2000 + Number(jahrRoh) : Number(jahrRoh);
  const d = new Date(jahr, Number(monat) - 1, Number(tag));
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export function parseRechnungText(text: string): ErkannteRechnung {
  const zeilen = text
    .split(/\r?\n/)
    .map((z) => z.trim())
    .filter(Boolean);

  const aussteller =
    zeilen.find(
      (z) => z.length > 2 && z.length < 60 && !/^\d/.test(z) && !/^--\s*\d+\s*of/i.test(z)
    ) ?? null;

  const rechnungsnummerMatch = text.match(
    /(?:Rechnungs(?:-)?(?:nummer|nr)\.?|Rechnung\s*Nr\.?|Invoice\s*(?:No|Number)\.?)\s*[:.]?\s*([A-Za-z0-9\-/]+)/i
  );
  const rechnungsnummer = rechnungsnummerMatch ? rechnungsnummerMatch[1] : null;

  let rechnungsdatum: string | null = null;
  const datumKontextMatch = text.match(
    /(?:Rechnungsdatum|Rechnung\s+vom|Datum)\s*[:.]?\s*(\d{1,2})\.(\d{1,2})\.(\d{2,4})/i
  );
  if (datumKontextMatch) {
    rechnungsdatum = normalisiereDatum(datumKontextMatch[1], datumKontextMatch[2], datumKontextMatch[3]);
  } else {
    const ersterDatumsMatch = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
    if (ersterDatumsMatch) {
      rechnungsdatum = normalisiereDatum(
        ersterDatumsMatch[1],
        ersterDatumsMatch[2],
        ersterDatumsMatch[3]
      );
    }
  }

  let betrag: number | null = null;
  const betragKontextMatch = text.match(
    /(?:Gesamtbetrag|Rechnungsbetrag|Gesamtsumme|Gesamt|Endbetrag|Zu\s*zahlen|Summe)\s*[:.]?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/i
  );
  if (betragKontextMatch) {
    betrag = parseGermanAmount(betragKontextMatch[1]);
  } else {
    const alleBetraege = Array.from(text.matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2})/g)).map((m) =>
      parseGermanAmount(m[1])
    );
    if (alleBetraege.length > 0) {
      betrag = Math.max(...alleBetraege);
    }
  }

  return { aussteller, rechnungsnummer, rechnungsdatum, betrag };
}
