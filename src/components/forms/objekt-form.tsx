"use client";

import { createObjekt, updateObjekt } from "@/lib/actions";
import { Modal, Field, TextAreaField, FieldRow } from "@/components/ui/modal";
import type { Objekt } from "@/generated/prisma/client";

function ObjektFields({ objekt }: { objekt?: Objekt }) {
  return (
    <>
      <Field label="Name des Objekts" name="name" defaultValue={objekt?.name} required />
      <FieldRow>
        <Field label="Straße & Hausnummer" name="strasse" defaultValue={objekt?.strasse} required />
        <Field label="PLZ" name="plz" defaultValue={objekt?.plz} required />
      </FieldRow>
      <Field label="Ort" name="ort" defaultValue={objekt?.ort} required />
      <TextAreaField
        label="Lage / Mikrolage"
        name="lage"
        defaultValue={objekt?.lage}
      />
      <FieldRow>
        <Field label="Baujahr" name="baujahr" type="number" defaultValue={objekt?.baujahr} />
        <Field
          label="Kaufpreis (€)"
          name="kaufpreis"
          type="number"
          step="0.01"
          defaultValue={objekt?.kaufpreis}
        />
      </FieldRow>
      <Field
        label="Kaufdatum"
        name="kaufdatum"
        type="date"
        defaultValue={
          objekt?.kaufdatum
            ? new Date(objekt.kaufdatum).toISOString().slice(0, 10)
            : undefined
        }
      />
      <div className="pt-1 border-t border-[var(--border)]">
        <p className="text-xs font-semibold text-[var(--muted)] mt-3 mb-1">
          Finanzierung / Bankrate
        </p>
      </div>
      <FieldRow>
        <Field
          label="Darlehenssumme (€)"
          name="darlehenssumme"
          type="number"
          step="0.01"
          defaultValue={objekt?.darlehenssumme}
        />
        <Field label="Bank" name="bankName" defaultValue={objekt?.bankName} />
      </FieldRow>
      <FieldRow>
        <Field
          label="Zinssatz (% p.a.)"
          name="zinssatzProzent"
          type="number"
          step="0.01"
          defaultValue={objekt?.zinssatzProzent}
        />
        <Field
          label="Tilgung (% p.a.)"
          name="tilgungProzent"
          type="number"
          step="0.01"
          defaultValue={objekt?.tilgungProzent}
        />
      </FieldRow>
      <Field
        label="Monatliche Bankrate (€)"
        name="bankrateMonatlich"
        type="number"
        step="0.01"
        defaultValue={objekt?.bankrateMonatlich}
      />
      <TextAreaField label="Notizen" name="notizen" defaultValue={objekt?.notizen} />
    </>
  );
}

export function NewObjektButton() {
  return (
    <Modal
      trigger={
        <button className="text-sm font-medium px-4 py-2 rounded-lg btn-primary">
          + Neues Objekt
        </button>
      }
      title="Neues Objekt anlegen"
      action={createObjekt}
      submitLabel="Objekt anlegen"
    >
      <ObjektFields />
    </Modal>
  );
}

export function EditObjektButton({ objekt }: { objekt: Objekt }) {
  return (
    <Modal
      trigger={
        <button className="text-sm font-medium px-3.5 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-muted)]">
          Objekt bearbeiten
        </button>
      }
      title={`${objekt.name} bearbeiten`}
      action={updateObjekt.bind(null, objekt.id)}
      submitLabel="Änderungen speichern"
    >
      <ObjektFields objekt={objekt} />
    </Modal>
  );
}
