"use client";

import { createWohnung, updateWohnung } from "@/lib/actions";
import { Modal, Field, TextAreaField, FieldRow } from "@/components/ui/modal";
import type { Wohnung } from "@/generated/prisma/client";

function WohnungFields({ wohnung }: { wohnung?: Wohnung }) {
  return (
    <>
      <FieldRow>
        <Field
          label="Bezeichnung"
          name="bezeichnung"
          defaultValue={wohnung?.bezeichnung}
          placeholder="z.B. Whg 3"
          required
        />
        <Field
          label="Lage im Objekt"
          name="lageImObjekt"
          defaultValue={wohnung?.lageImObjekt}
          placeholder="z.B. 2. OG rechts"
          required
        />
      </FieldRow>
      <FieldRow>
        <Field
          label="Größe (m²)"
          name="groesseQm"
          type="number"
          step="0.1"
          defaultValue={wohnung?.groesseQm}
          required
        />
        <Field
          label="Zimmer"
          name="zimmer"
          type="number"
          step="0.5"
          defaultValue={wohnung?.zimmer}
        />
      </FieldRow>
      <Field
        label="Zielmiete (€/m², netto kalt)"
        name="zielmieteProQm"
        type="number"
        step="0.01"
        defaultValue={wohnung?.zielmieteProQm}
      />
      <TextAreaField label="Notizen" name="notizen" defaultValue={wohnung?.notizen} />
    </>
  );
}

export function NewWohnungButton({ objektId }: { objektId: string }) {
  return (
    <Modal
      trigger={
        <button className="text-sm font-medium px-3.5 py-2 rounded-lg btn-primary">
          + Wohnung hinzufügen
        </button>
      }
      title="Neue Wohnung anlegen"
      action={createWohnung.bind(null, objektId)}
      submitLabel="Wohnung anlegen"
    >
      <WohnungFields />
    </Modal>
  );
}

export function EditWohnungButton({ wohnung }: { wohnung: Wohnung }) {
  return (
    <Modal
      trigger={
        <button className="text-xs font-medium text-[var(--brand)] hover:underline">
          Bearbeiten
        </button>
      }
      title={`${wohnung.bezeichnung} bearbeiten`}
      action={updateWohnung.bind(null, wohnung.id)}
      submitLabel="Änderungen speichern"
    >
      <WohnungFields wohnung={wohnung} />
    </Modal>
  );
}
