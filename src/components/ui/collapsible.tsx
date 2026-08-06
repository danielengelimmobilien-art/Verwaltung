"use client";

import { useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { ChevronRightIcon } from "@/components/ui/icons";

export function Collapsible({
  title,
  subtitle,
  defaultOpen = false,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
        >
          <ChevronRightIcon
            className={clsx(
              "h-4 w-4 shrink-0 text-[var(--muted)] transition-transform",
              open && "rotate-90"
            )}
          />
          <span className="min-w-0">
            <span className="font-semibold text-sm">{title}</span>
            {subtitle && (
              <span className="block text-xs text-[var(--muted)] mt-0.5">{subtitle}</span>
            )}
          </span>
        </button>
        {actions && (
          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
            {actions}
          </div>
        )}
      </div>
      {open && (
        <div className="border-t border-[var(--border)] px-4 sm:px-5 py-4">{children}</div>
      )}
    </div>
  );
}
