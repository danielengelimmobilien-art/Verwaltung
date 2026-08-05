"use client";

import { useEffect, useState, useTransition } from "react";
import { starteBankverbindung, ladeInstitutionen } from "@/lib/bank-actions";
import { Modal, Field, FieldRow, SelectField } from "@/components/ui/modal";

const LAENDER = [
  { value: "DE", label: "Deutschland" },
  { value: "AT", label: "Österreich" },
  { value: "CH", label: "Schweiz" },
];

function InstitutionPicker() {
  const [land, setLand] = useState("DE");
  const [institute, setInstitute] = useState<{ id: string; name: string }[]>([]);
  const [ausgewaehlt, setAusgewaehlt] = useState("");
  const [pending, startTransition] = useTransition();
  const [fehler, setFehler] = useState<string | null>(null);

  function ladeInstitute(fuerLand: string) {
    startTransition(async () => {
      setFehler(null);
      try {
        const res = await ladeInstitutionen(fuerLand);
        setInstitute(res);
        setAusgewaehlt(res[0]?.id ?? "");
      } catch {
        setInstitute([]);
        setFehler("Institute konnten nicht geladen werden.");
      }
    });
  }

  function ladeFuerLand(neuesLand: string) {
    setLand(neuesLand);
    ladeInstitute(neuesLand);
  }

  useEffect(() => {
    ladeInstitute("DE");
  }, []);

  const ausgewaehlteInstitution = institute.find((i) => i.id === ausgewaehlt);

  return (
    <>
      <FieldRow>
        <div>
          <label htmlFor="land">Land</label>
          <select
            id="land"
            value={land}
            onChange={(e) => ladeFuerLand(e.target.value)}
          >
            {LAENDER.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="institutionId">Bank</label>
          <select
            id="institutionId"
            name="institutionId"
            value={ausgewaehlt}
            onChange={(e) => setAusgewaehlt(e.target.value)}
            disabled={pending || institute.length === 0}
            required
          >
            {pending && <option>Lädt…</option>}
            {!pending &&
              institute.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
          </select>
        </div>
      </FieldRow>
      {fehler && <p className="text-sm text-[var(--bad)]">{fehler}</p>}
      <input type="hidden" name="institutionName" value={ausgewaehlteInstitution?.name ?? ""} />
    </>
  );
}

export function NewBankkontoButton({
  objekte,
}: {
  objekte: { id: string; name: string }[];
}) {
  return (
    <Modal
      trigger={
        <button className="text-sm font-medium px-4 py-2 rounded-lg btn-primary">
          + Bankkonto verbinden
        </button>
      }
      title="Bankkonto verbinden"
      description="Du wirst zur Bank weitergeleitet, um den Zugriff zu autorisieren (PSD2, via GoCardless Bank Account Data). Danach kommst du automatisch zurück."
      action={starteBankverbindung}
      submitLabel="Weiter zur Bank"
    >
      <InstitutionPicker />
      <Field
        label="Anzeigename (optional)"
        name="bezeichnung"
        placeholder="z.B. Sparkasse Girokonto"
      />
      <SelectField
        label="Zuständig für"
        name="objektId"
        defaultValue=""
        options={[
          { value: "", label: "Portfolioweit (alle Objekte)" },
          ...objekte.map((o) => ({ value: o.id, label: o.name })),
        ]}
      />
    </Modal>
  );
}
