"use client";

import { useRef, useState, useTransition } from "react";
import { analysiereBeleg, createBeleg, updateBeleg } from "@/lib/beleg-actions";
import { Field, FieldRow, SelectField, TextAreaField } from "@/components/ui/modal";
import type { Beleg } from "@/generated/prisma/client";

const BK_KATEGORIEN = [
  "Hausmeister",
  "Versicherung",
  "Wasser/Abwasser",
  "Strom (Gemeinschaft)",
  "Müllabfuhr",
  "Wartung/Instandhaltung",
  "Grundsteuer",
  "Sonstiges",
];

function toDateInput(d: Date | string | null | undefined) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

function BelegFelder({
  aussteller,
  rechnungsnummer,
  rechnungsdatum,
  betrag,
  beschreibung,
  objektId,
  bkKategorie,
  notizen,
  objekte,
}: {
  aussteller?: string | null;
  rechnungsnummer?: string | null;
  rechnungsdatum?: string | null;
  betrag?: number | null;
  beschreibung?: string | null;
  objektId?: string | null;
  bkKategorie?: string | null;
  notizen?: string | null;
  objekte: { id: string; name: string }[];
}) {
  return (
    <>
      <Field label="Aussteller / Lieferant" name="aussteller" defaultValue={aussteller} required />
      <FieldRow>
        <Field label="Rechnungsnummer" name="rechnungsnummer" defaultValue={rechnungsnummer} />
        <Field
          label="Rechnungsdatum"
          name="rechnungsdatum"
          type="date"
          defaultValue={rechnungsdatum}
          required
        />
      </FieldRow>
      <Field
        label="Betrag (€)"
        name="betrag"
        type="number"
        step="0.01"
        defaultValue={betrag}
        required
      />
      <TextAreaField label="Beschreibung" name="beschreibung" defaultValue={beschreibung} />
      <FieldRow>
        <SelectField
          label="Objekt"
          name="objektId"
          defaultValue={objektId ?? ""}
          options={[
            { value: "", label: "Kein Objekt" },
            ...objekte.map((o) => ({ value: o.id, label: o.name })),
          ]}
        />
        <SelectField
          label="Kategorie"
          name="bkKategorie"
          defaultValue={bkKategorie ?? "Sonstiges"}
          options={BK_KATEGORIEN.map((k) => ({ value: k, label: k }))}
        />
      </FieldRow>
      <TextAreaField label="Notizen" name="notizen" defaultValue={notizen} />
    </>
  );
}

export function NewBelegButton({ objekte }: { objekte: { id: string; name: string }[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [schritt, setSchritt] = useState<1 | 2>(1);
  const [pending, startTransition] = useTransition();
  const [fehler, setFehler] = useState<string | null>(null);
  const [erkannt, setErkannt] = useState<{
    aussteller: string | null;
    rechnungsnummer: string | null;
    rechnungsdatum: string | null;
    betrag: number | null;
  } | null>(null);

  function reset() {
    setSchritt(1);
    setErkannt(null);
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
        const res = await analysiereBeleg(formData);
        setErkannt(res);
        setSchritt(2);
      } catch (err) {
        setFehler(err instanceof Error ? err.message : "Analyse fehlgeschlagen.");
      }
    });
  }

  function speichern(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFehler(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createBeleg(formData);
        schliessen();
      } catch (err) {
        setFehler(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={oeffnen}
        className="text-sm font-medium px-4 py-2 rounded-lg btn-primary"
      >
        + Beleg hochladen
      </button>
      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) schliessen();
        }}
        className="w-full max-w-lg m-auto"
      >
        <div className="p-5 sm:p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold">Beleg hochladen</h2>
            <p className="text-sm text-[var(--muted)] mt-0.5">
              {schritt === 1
                ? "Rechnung/Beleg als PDF hochladen – Aussteller, Datum und Betrag werden automatisch vorgeschlagen."
                : "Bitte erkannte Angaben prüfen und bei Bedarf korrigieren."}
            </p>
          </div>

          {schritt === 1 ? (
            <form onSubmit={analysieren} className="flex flex-col gap-3">
              <div>
                <label htmlFor="beleg-datei">PDF-Datei</label>
                <input id="beleg-datei" name="datei" type="file" accept="application/pdf,.pdf" required />
              </div>
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
                  {pending ? "Analysiert…" : "Rechnung analysieren"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={speichern} className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 max-h-[55vh] overflow-y-auto pr-1">
                <BelegFelder
                  aussteller={erkannt?.aussteller}
                  rechnungsnummer={erkannt?.rechnungsnummer}
                  rechnungsdatum={erkannt?.rechnungsdatum}
                  betrag={erkannt?.betrag}
                  objekte={objekte}
                />
              </div>
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
                  type="submit"
                  disabled={pending}
                  className="px-3.5 py-2 rounded-lg text-sm font-medium btn-primary disabled:opacity-60"
                >
                  {pending ? "Speichert…" : "Beleg speichern"}
                </button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}

export function EditBelegButton({
  beleg,
  objekte,
}: {
  beleg: Beleg;
  objekte: { id: string; name: string }[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const [fehler, setFehler] = useState<string | null>(null);

  function speichern(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFehler(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateBeleg(beleg.id, formData);
        dialogRef.current?.close();
      } catch (err) {
        setFehler(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="text-xs font-medium text-[var(--brand)] hover:underline"
      >
        Bearbeiten
      </button>
      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="w-full max-w-lg m-auto"
      >
        <form onSubmit={speichern} className="p-5 sm:p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold">{beleg.aussteller} bearbeiten</h2>
          <div className="flex flex-col gap-3 max-h-[55vh] overflow-y-auto pr-1">
            <BelegFelder
              aussteller={beleg.aussteller}
              rechnungsnummer={beleg.rechnungsnummer}
              rechnungsdatum={toDateInput(beleg.rechnungsdatum)}
              betrag={beleg.betrag}
              beschreibung={beleg.beschreibung}
              objektId={beleg.objektId}
              bkKategorie={beleg.bkKategorie}
              notizen={beleg.notizen}
              objekte={objekte}
            />
          </div>
          {fehler && <p className="text-sm text-[var(--bad)]">{fehler}</p>}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-muted)]"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-3.5 py-2 rounded-lg text-sm font-medium btn-primary disabled:opacity-60"
            >
              {pending ? "Speichert…" : "Änderungen speichern"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
