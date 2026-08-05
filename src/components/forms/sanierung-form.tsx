"use client";

import { createSanierung, updateSanierung } from "@/lib/actions";
import {
  Modal,
  Field,
  TextAreaField,
  FieldRow,
  SelectField,
} from "@/components/ui/modal";
import type { Sanierung } from "@/generated/prisma/client";

const kategorien = [
  "Dach",
  "Fassade",
  "Fenster",
  "Heizung",
  "Elektrik",
  "Bad",
  "Sanitär",
  "Treppenhaus",
  "Außenanlagen",
  "Sonstiges",
].map((k) => ({ value: k, label: k }));

const statusOptions = [
  { value: "geplant", label: "Geplant" },
  { value: "in_arbeit", label: "In Arbeit" },
  { value: "abgeschlossen", label: "Abgeschlossen" },
];

function toDateInput(d: Date | string | null | undefined) {
  if (!d) return undefined;
  return new Date(d).toISOString().slice(0, 10);
}

function SanierungFields({ sanierung }: { sanierung?: Sanierung }) {
  return (
    <>
      <Field label="Titel der Maßnahme" name="titel" defaultValue={sanierung?.titel} required />
      <FieldRow>
        <SelectField
          label="Kategorie"
          name="kategorie"
          defaultValue={sanierung?.kategorie ?? "Sonstiges"}
          options={kategorien}
        />
        <SelectField
          label="Status"
          name="status"
          defaultValue={sanierung?.status ?? "geplant"}
          options={statusOptions}
        />
      </FieldRow>
      <FieldRow>
        <Field
          label="Datum"
          name="datum"
          type="date"
          defaultValue={toDateInput(sanierung?.datum) ?? new Date().toISOString().slice(0, 10)}
          required
        />
        <Field
          label="Kosten (€)"
          name="kosten"
          type="number"
          step="0.01"
          defaultValue={sanierung?.kosten}
        />
      </FieldRow>
      <TextAreaField
        label="Beschreibung"
        name="beschreibung"
        defaultValue={sanierung?.beschreibung}
      />
      <Field
        label="Ablage-Hinweis (Ordner/Beleg)"
        name="belegHinweis"
        defaultValue={sanierung?.belegHinweis}
        placeholder="z.B. Ordner 'MFH Lindenstraße/Sanierung 2024'"
      />
    </>
  );
}

export function NewSanierungButton({ objektId }: { objektId: string }) {
  return (
    <Modal
      trigger={
        <button className="text-sm font-medium px-3.5 py-2 rounded-lg bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]">
          + Maßnahme erfassen
        </button>
      }
      title="Neue Sanierungs-/Modernisierungsmaßnahme"
      action={createSanierung.bind(null, objektId)}
      submitLabel="Maßnahme anlegen"
    >
      <SanierungFields />
    </Modal>
  );
}

export function EditSanierungButton({
  sanierung,
  objektId,
}: {
  sanierung: Sanierung;
  objektId: string;
}) {
  return (
    <Modal
      trigger={
        <button className="text-xs font-medium text-[var(--brand)] hover:underline">
          Bearbeiten
        </button>
      }
      title={`${sanierung.titel} bearbeiten`}
      action={updateSanierung.bind(null, sanierung.id, objektId)}
      submitLabel="Änderungen speichern"
    >
      <SanierungFields sanierung={sanierung} />
    </Modal>
  );
}
