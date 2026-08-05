"use client";

import { createKontakt, updateKontakt } from "@/lib/actions";
import {
  Modal,
  Field,
  TextAreaField,
  FieldRow,
  SelectField,
} from "@/components/ui/modal";
import type { Kontakt } from "@/generated/prisma/client";

const kategorien = [
  "Elektrik",
  "Gas/Wasser/Sanitär",
  "Dachdecker",
  "Schornsteinfeger",
  "Hausverwaltung",
  "Sonstiges",
].map((k) => ({ value: k, label: k }));

function KontaktFields({
  kontakt,
  objekte,
}: {
  kontakt?: Kontakt;
  objekte: { id: string; name: string }[];
}) {
  return (
    <>
      <FieldRow>
        <SelectField
          label="Kategorie"
          name="kategorie"
          defaultValue={kontakt?.kategorie ?? "Sonstiges"}
          options={kategorien}
        />
        <SelectField
          label="Zuständig für"
          name="objektId"
          defaultValue={kontakt?.objektId ?? ""}
          options={[
            { value: "", label: "Portfolioweit (kein bestimmtes Objekt)" },
            ...objekte.map((o) => ({ value: o.id, label: o.name })),
          ]}
        />
      </FieldRow>
      <Field
        label="Firma / Name"
        name="name"
        defaultValue={kontakt?.name}
        required
      />
      <Field
        label="Ansprechpartner"
        name="ansprechpartner"
        defaultValue={kontakt?.ansprechpartner}
      />
      <FieldRow>
        <Field label="Telefon" name="telefon" type="tel" defaultValue={kontakt?.telefon} />
        <Field label="E-Mail" name="email" type="email" defaultValue={kontakt?.email} />
      </FieldRow>
      <Field label="Adresse" name="adresse" defaultValue={kontakt?.adresse} />
      <TextAreaField label="Notizen" name="notizen" defaultValue={kontakt?.notizen} />
    </>
  );
}

export function NewKontaktButton({
  objekte,
}: {
  objekte: { id: string; name: string }[];
}) {
  return (
    <Modal
      trigger={
        <button className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]">
          + Kontakt anlegen
        </button>
      }
      title="Neuer Kontakt"
      action={createKontakt}
      submitLabel="Kontakt anlegen"
    >
      <KontaktFields objekte={objekte} />
    </Modal>
  );
}

export function EditKontaktButton({
  kontakt,
  objekte,
}: {
  kontakt: Kontakt;
  objekte: { id: string; name: string }[];
}) {
  return (
    <Modal
      trigger={
        <button className="text-xs font-medium text-[var(--brand)] hover:underline">
          Bearbeiten
        </button>
      }
      title={`${kontakt.name} bearbeiten`}
      action={updateKontakt.bind(null, kontakt.id)}
      submitLabel="Änderungen speichern"
    >
      <KontaktFields kontakt={kontakt} objekte={objekte} />
    </Modal>
  );
}
