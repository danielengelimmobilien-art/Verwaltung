"use client";

import { createTextvorlage, updateTextvorlage } from "@/lib/actions";
import { Modal, Field, TextAreaField, SelectField } from "@/components/ui/modal";
import type { Textvorlage } from "@/generated/prisma/client";

const kategorien = [
  "Mahnung",
  "Mieterhöhung",
  "Kündigungsbestätigung",
  "Nebenkostenabrechnung",
  "Wohnungsübergabe",
  "Willkommen/Einzug",
  "Sonstiges",
].map((k) => ({ value: k, label: k }));

function TextvorlageFields({ vorlage }: { vorlage?: Textvorlage }) {
  return (
    <>
      <Field label="Titel" name="titel" defaultValue={vorlage?.titel} required />
      <SelectField
        label="Kategorie"
        name="kategorie"
        defaultValue={vorlage?.kategorie ?? "Sonstiges"}
        options={kategorien}
      />
      <div>
        <label htmlFor="inhalt">Inhalt</label>
        <textarea
          id="inhalt"
          name="inhalt"
          rows={12}
          defaultValue={vorlage?.inhalt}
          placeholder="Text der Vorlage…"
          className="font-mono text-xs"
        />
      </div>
      <TextAreaField label="Notizen" name="notizen" defaultValue={vorlage?.notizen} />
    </>
  );
}

export function NewTextvorlageButton() {
  return (
    <Modal
      trigger={
        <button className="text-sm font-medium px-4 py-2 rounded-lg btn-primary">
          + Vorlage anlegen
        </button>
      }
      title="Neue Textvorlage"
      action={createTextvorlage}
      submitLabel="Vorlage anlegen"
    >
      <TextvorlageFields />
    </Modal>
  );
}

export function EditTextvorlageButton({ vorlage }: { vorlage: Textvorlage }) {
  return (
    <Modal
      trigger={
        <button className="text-xs font-medium text-[var(--brand)] hover:underline">
          Bearbeiten
        </button>
      }
      title={`${vorlage.titel} bearbeiten`}
      action={updateTextvorlage.bind(null, vorlage.id)}
      submitLabel="Änderungen speichern"
    >
      <TextvorlageFields vorlage={vorlage} />
    </Modal>
  );
}
