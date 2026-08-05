"use client";

import { createMieterhoehung } from "@/lib/actions";
import { Modal, Field, TextAreaField } from "@/components/ui/modal";

export function NewMieterhoehungButton({
  mietverhaeltnisId,
  objektId,
  aktuelleKaltmiete,
}: {
  mietverhaeltnisId: string;
  objektId: string;
  aktuelleKaltmiete: number;
}) {
  return (
    <Modal
      trigger={
        <button className="text-xs font-medium text-[var(--brand)] hover:underline">
          Mieterhöhung erfassen
        </button>
      }
      title="Mieterhöhung erfassen"
      description={`Aktuelle Nettokaltmiete: ${aktuelleKaltmiete.toFixed(2)} €`}
      action={createMieterhoehung.bind(null, mietverhaeltnisId, objektId)}
      submitLabel="Mieterhöhung speichern"
    >
      <Field
        label="Datum der Erhöhung"
        name="datum"
        type="date"
        defaultValue={new Date().toISOString().slice(0, 10)}
        required
      />
      <Field
        label="Neue Nettokaltmiete (€)"
        name="neueKaltmiete"
        type="number"
        step="0.01"
        defaultValue={aktuelleKaltmiete}
        required
      />
      <TextAreaField
        label="Grund (z.B. Mietspiegel, Staffelmiete, Indexmiete)"
        name="grund"
      />
    </Modal>
  );
}
