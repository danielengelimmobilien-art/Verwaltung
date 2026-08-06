"use client";

import { useRef, useState, useTransition } from "react";
import { analysiereKontoauszug, importiereKontobewegungen } from "@/lib/bank-actions";
import { formatEuro } from "@/lib/calc";

type Zeile = {
  datum: string;
  betrag: number;
  verwendungszweck: string;
  vorzeichenErkannt: boolean;
  enthalten: boolean;
};

export function PdfImportButton({
  bankkonten,
  objekte,
}: {
  bankkonten: { id: string; bezeichnung: string }[];
  objekte: { id: string; name: string }[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [schritt, setSchritt] = useState<1 | 2>(1);
  const [zeilen, setZeilen] = useState<Zeile[]>([]);
  const [pending, startTransition] = useTransition();
  const [fehler, setFehler] = useState<string | null>(null);
  const [zielKonto, setZielKonto] = useState(bankkonten[0]?.id ?? "__neu__");
  const [neueBezeichnung, setNeueBezeichnung] = useState("");
  const [neuesObjekt, setNeuesObjekt] = useState("");

  function reset() {
    setSchritt(1);
    setZeilen([]);
    setFehler(null);
  }

  function oeffnen() {
    reset();
    dialogRef.current?.showModal();
  }

  function schliessen() {
    dialogRef.current?.close();
    reset();
  }

  function analysieren(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFehler(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const res = await analysiereKontoauszug(formData);
        setZeilen(res.zeilen.map((z) => ({ ...z, enthalten: true })));
        setSchritt(2);
      } catch (err) {
        setFehler(err instanceof Error ? err.message : "Analyse fehlgeschlagen.");
      }
    });
  }

  function importieren() {
    setFehler(null);
    const ausgewaehlt = zeilen.filter((z) => z.enthalten);
    if (ausgewaehlt.length === 0) {
      setFehler("Bitte mindestens eine Buchung auswählen.");
      return;
    }
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("bankkontoId", zielKonto === "__neu__" ? "" : zielKonto);
        formData.set("neueBezeichnung", neueBezeichnung);
        formData.set("neuesObjektId", neuesObjekt);
        formData.set(
          "zeilen",
          JSON.stringify(
            ausgewaehlt.map(({ datum, betrag, verwendungszweck }) => ({
              datum,
              betrag,
              verwendungszweck,
            }))
          )
        );
        await importiereKontobewegungen(formData);
        schliessen();
      } catch (err) {
        setFehler(err instanceof Error ? err.message : "Import fehlgeschlagen.");
      }
    });
  }

  function zeileAendern(index: number, patch: Partial<Zeile>) {
    setZeilen((prev) => prev.map((z, i) => (i === index ? { ...z, ...patch } : z)));
  }

  const summe = zeilen.filter((z) => z.enthalten).reduce((s, z) => s + z.betrag, 0);

  return (
    <>
      <button
        type="button"
        onClick={oeffnen}
        className="text-sm font-medium px-4 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-muted)]"
      >
        PDF-Kontoauszug hochladen
      </button>
      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) schliessen();
        }}
        className="w-full max-w-3xl m-auto"
      >
        <div className="p-5 sm:p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold">Kontoauszug (PDF) importieren</h2>
            <p className="text-sm text-[var(--muted)] mt-0.5">
              {schritt === 1
                ? "Monatlicher Kontoauszug als PDF – Buchungen werden automatisch erkannt und danach zur Kontrolle angezeigt."
                : `${zeilen.length} Buchung(en) erkannt. Bitte prüfen, korrigieren und bestätigen.`}
            </p>
          </div>

          {schritt === 1 ? (
            <form onSubmit={analysieren} className="flex flex-col gap-3">
              <div>
                <label htmlFor="datei">PDF-Datei</label>
                <input id="datei" name="datei" type="file" accept="application/pdf,.pdf" required />
              </div>
              <div>
                <label htmlFor="zielKonto">Zielkonto</label>
                <select
                  id="zielKonto"
                  value={zielKonto}
                  onChange={(e) => setZielKonto(e.target.value)}
                >
                  {bankkonten.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bezeichnung}
                    </option>
                  ))}
                  <option value="__neu__">+ Neues manuelles Konto</option>
                </select>
              </div>
              {zielKonto === "__neu__" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="neueBezeichnung">Anzeigename</label>
                    <input
                      id="neueBezeichnung"
                      value={neueBezeichnung}
                      onChange={(e) => setNeueBezeichnung(e.target.value)}
                      placeholder="z.B. Sparkasse Girokonto"
                    />
                  </div>
                  <div>
                    <label htmlFor="neuesObjekt">Zuständig für</label>
                    <select
                      id="neuesObjekt"
                      value={neuesObjekt}
                      onChange={(e) => setNeuesObjekt(e.target.value)}
                    >
                      <option value="">Portfolioweit</option>
                      {objekte.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              {fehler && <p className="text-sm text-[var(--bad)]">{fehler}</p>}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={schliessen}
                  className="px-3.5 py-2 rounded-lg text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-muted)]"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="px-3.5 py-2 rounded-lg text-sm font-medium btn-primary disabled:opacity-60"
                >
                  {pending ? "Analysiert…" : "PDF analysieren"}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="max-h-[45vh] overflow-y-auto border border-[var(--border)] rounded-lg">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[var(--surface)]">
                    <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                      <th className="px-2 py-2 w-8"></th>
                      <th className="px-2 py-2">Datum</th>
                      <th className="px-2 py-2">Verwendungszweck</th>
                      <th className="px-2 py-2 text-right">Betrag (€)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zeilen.map((z, i) => (
                      <tr key={i} className="border-b border-[var(--border)] last:border-0">
                        <td className="px-2 py-1.5">
                          <input
                            type="checkbox"
                            checked={z.enthalten}
                            onChange={(e) => zeileAendern(i, { enthalten: e.target.checked })}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="date"
                            value={z.datum}
                            onChange={(e) => zeileAendern(i, { datum: e.target.value })}
                            className="!py-1"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="text"
                            value={z.verwendungszweck}
                            onChange={(e) => zeileAendern(i, { verwendungszweck: e.target.value })}
                            className="!py-1"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            step="0.01"
                            value={z.betrag}
                            onChange={(e) =>
                              zeileAendern(i, { betrag: Number(e.target.value) || 0 })
                            }
                            className="!py-1 text-right"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-[var(--muted)]">
                {zeilen.filter((z) => z.enthalten).length} von {zeilen.length} ausgewählt · Summe:{" "}
                <span className="font-semibold">{formatEuro(summe)}</span> · Vorzeichen ohne
                erkanntes +/- wurden als eingehend (positiv) angenommen – bei Ausgaben bitte
                Betrag mit Minus korrigieren.
              </p>
              {fehler && <p className="text-sm text-[var(--bad)]">{fehler}</p>}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setSchritt(1)}
                  className="px-3.5 py-2 rounded-lg text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-muted)]"
                >
                  Zurück
                </button>
                <button
                  type="button"
                  onClick={importieren}
                  disabled={pending}
                  className="px-3.5 py-2 rounded-lg text-sm font-medium btn-primary disabled:opacity-60"
                >
                  {pending
                    ? "Importiert…"
                    : `${zeilen.filter((z) => z.enthalten).length} Buchung(en) importieren`}
                </button>
              </div>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
