"use client";

import { useTransition } from "react";
import { clsx } from "clsx";

export function DeleteButton({
  action,
  confirmText,
  label = "Löschen",
  className,
}: {
  action: () => Promise<void>;
  confirmText: string;
  label?: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => {
        if (window.confirm(confirmText)) {
          startTransition(action);
        }
      }}
      disabled={pending}
      className={clsx(
        "text-xs font-medium text-[var(--bad)] hover:underline disabled:opacity-50",
        className
      )}
    >
      {pending ? "Lösche…" : label}
    </button>
  );
}
