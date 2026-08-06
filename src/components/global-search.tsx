"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { sucheGlobal, type SuchTreffer } from "@/lib/search-actions";
import {
  SearchIcon,
  BuildingIcon,
  UsersIcon,
  ContactIcon,
  WrenchIcon,
  FileTextIcon,
  BankIcon,
} from "@/components/ui/icons";

const TYP_LABEL: Record<SuchTreffer["typ"], string> = {
  objekt: "Objekt",
  wohnung: "Wohnung",
  mieter: "Mieter",
  kontakt: "Kontakt",
  sanierung: "Sanierung",
  textvorlage: "Vorlage",
  bankkonto: "Bankkonto",
};

const TYP_ICON: Record<SuchTreffer["typ"], typeof BuildingIcon> = {
  objekt: BuildingIcon,
  wohnung: BuildingIcon,
  mieter: UsersIcon,
  kontakt: ContactIcon,
  sanierung: WrenchIcon,
  textvorlage: FileTextIcon,
  bankkonto: BankIcon,
};

export function GlobalSearch() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [ergebnisse, setErgebnisse] = useState<SuchTreffer[]>([]);
  const [pending, startTransition] = useTransition();

  function oeffnen() {
    dialogRef.current?.showModal();
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function schliessen() {
    dialogRef.current?.close();
    setQuery("");
    setErgebnisse([]);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        oeffnen();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const q = query.trim();
    const timeout = setTimeout(() => {
      if (q.length < 2) {
        setErgebnisse([]);
        return;
      }
      startTransition(async () => {
        const res = await sucheGlobal(q);
        setErgebnisse(res);
      });
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <>
      <button
        type="button"
        onClick={oeffnen}
        aria-label="Suchen"
        title="Suchen (Strg/Cmd+K)"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] transition-colors"
      >
        <SearchIcon className="h-4 w-4" />
      </button>
      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) schliessen();
        }}
        className="w-full max-w-xl m-auto mt-24"
      >
        <div className="p-4 flex flex-col gap-3">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Objekte, Wohnungen, Mieter, Kontakte, Sanierungen, Vorlagen durchsuchen…"
            className="text-base"
          />
          <div className="max-h-[50vh] overflow-y-auto flex flex-col gap-0.5">
            {pending && <p className="text-xs text-[var(--muted)] px-2.5 py-1.5">Suche…</p>}
            {!pending && query.trim().length >= 2 && ergebnisse.length === 0 && (
              <p className="text-xs text-[var(--muted)] px-2.5 py-1.5">Keine Treffer.</p>
            )}
            {query.trim().length < 2 && (
              <p className="text-xs text-[var(--muted)] px-2.5 py-1.5">
                Mindestens 2 Zeichen eingeben.
              </p>
            )}
            {ergebnisse.map((t, i) => {
              const Icon = TYP_ICON[t.typ];
              return (
                <Link
                  key={`${t.typ}-${i}-${t.href}`}
                  href={t.href}
                  onClick={schliessen}
                  className="flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-[var(--surface-muted)]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium truncate">{t.titel}</span>
                    <span className="block text-xs text-[var(--muted)] truncate">
                      {t.untertitel}
                    </span>
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-[var(--muted)] shrink-0">
                    {TYP_LABEL[t.typ]}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </dialog>
    </>
  );
}
