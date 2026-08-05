"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";

export function Modal({
  trigger,
  title,
  description,
  action,
  children,
  submitLabel = "Speichern",
}: {
  trigger: ReactNode;
  title: string;
  description?: string;
  action: (formData: FormData) => Promise<void>;
  children: ReactNode;
  submitLabel?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function open() {
    setError(null);
    dialogRef.current?.showModal();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await action(formData);
        dialogRef.current?.close();
      } catch (err) {
        // Next.js redirect() throws internally – let it propagate.
        if (
          err &&
          typeof err === "object" &&
          "digest" in err &&
          typeof (err as { digest?: string }).digest === "string" &&
          (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
        ) {
          throw err;
        }
        setError("Speichern fehlgeschlagen. Bitte Eingaben prüfen.");
      }
    });
  }

  return (
    <>
      <span onClick={open} className="contents cursor-pointer">
        {trigger}
      </span>
      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="w-full max-w-lg m-auto"
      >
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && (
              <p className="text-sm text-[var(--muted)] mt-0.5">{description}</p>
            )}
          </div>
          <div className="flex flex-col gap-3 max-h-[65vh] overflow-y-auto pr-1">
            {children}
          </div>
          {error && <p className="text-sm text-[var(--bad)]">{error}</p>}
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
              {pending ? "Speichert…" : submitLabel}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  step,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  required?: boolean;
  step?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        placeholder={placeholder}
        defaultValue={defaultValue ?? undefined}
        required={required}
      />
    </div>
  );
}

export function TextAreaField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
}) {
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <textarea id={name} name={name} rows={3} defaultValue={defaultValue ?? undefined} />
    </div>
  );
}

export function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <select id={name} name={name} defaultValue={defaultValue}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}
