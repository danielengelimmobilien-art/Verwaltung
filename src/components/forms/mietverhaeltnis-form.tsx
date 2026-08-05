"use client";

import {
  beendeMietverhaeltnis,
  createMietverhaeltnis,
  updateMietverhaeltnis,
} from "@/lib/actions";
import { Modal, Field, TextAreaField, FieldRow } from "@/components/ui/modal";
import type { Mietverhaeltnis } from "@/generated/prisma/client";

function toDateInput(d: Date | string | null | undefined) {
  if (!d) return undefined;
  return new Date(d).toISOString().slice(0, 10);
}

function MietverhaeltnisFields({ mv }: { mv?: Mietverhaeltnis }) {
  return (
    <>
      <Field label="Mieter" name="mieterName" defaultValue={mv?.mieterName} required />
      <FieldRow>
        <Field
          label="Einzugstermin"
          name="einzugsdatum"
          type="date"
          defaultValue={toDateInput(mv?.einzugsdatum)}
          required
        />
        <Field
          label="Kaution (€)"
          name="kaution"
          type="number"
          step="0.01"
          defaultValue={mv?.kaution}
        />
      </FieldRow>
      <Field
        label="Nettokaltmiete (€)"
        name="kaltmiete"
        type="number"
        step="0.01"
        defaultValue={mv?.kaltmiete}
        required
      />
      <FieldRow>
        <Field
          label="Betriebskosten-Vorauszahlung (€)"
          name="betriebskosten"
          type="number"
          step="0.01"
          defaultValue={mv?.betriebskostenVorauszahlung}
        />
        <Field
          label="Heizkosten-Vorauszahlung (€)"
          name="heizkosten"
          type="number"
          step="0.01"
          defaultValue={mv?.heizkostenVorauszahlung}
        />
      </FieldRow>
      <TextAreaField label="Notizen" name="notizen" defaultValue={mv?.notizen} />
    </>
  );
}

export function NewMietverhaeltnisButton({
  wohnungId,
  objektId,
}: {
  wohnungId: string;
  objektId: string;
}) {
  return (
    <Modal
      trigger={
        <button className="text-xs font-medium text-[var(--brand)] hover:underline">
          Mieter eintragen
        </button>
      }
      title="Neues Mietverhältnis"
      description="Ein evtl. bestehendes aktives Mietverhältnis dieser Wohnung wird automatisch beendet."
      action={createMietverhaeltnis.bind(null, wohnungId, objektId)}
      submitLabel="Mietverhältnis anlegen"
    >
      <MietverhaeltnisFields />
    </Modal>
  );
}

export function EditMietverhaeltnisButton({
  mv,
  objektId,
}: {
  mv: Mietverhaeltnis;
  objektId: string;
}) {
  return (
    <Modal
      trigger={
        <button className="text-xs font-medium text-[var(--brand)] hover:underline">
          Bearbeiten
        </button>
      }
      title={`Mietverhältnis ${mv.mieterName} bearbeiten`}
      action={updateMietverhaeltnis.bind(null, mv.id, objektId)}
      submitLabel="Änderungen speichern"
    >
      <MietverhaeltnisFields mv={mv} />
    </Modal>
  );
}

export function EndMietverhaeltnisButton({
  mv,
  objektId,
}: {
  mv: Mietverhaeltnis;
  objektId: string;
}) {
  return (
    <Modal
      trigger={
        <button className="text-xs font-medium text-[var(--muted)] hover:underline">
          Auszug erfassen
        </button>
      }
      title={`Auszug: ${mv.mieterName}`}
      action={beendeMietverhaeltnis.bind(null, mv.id, objektId)}
      submitLabel="Auszug speichern"
    >
      <Field
        label="Auszugsdatum"
        name="auszugsdatum"
        type="date"
        defaultValue={new Date().toISOString().slice(0, 10)}
        required
      />
    </Modal>
  );
}
