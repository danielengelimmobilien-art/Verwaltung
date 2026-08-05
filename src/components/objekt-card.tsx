import Link from "next/link";
import { formatEuro } from "@/lib/calc";
import { performanceLevel } from "@/lib/calc";
import { PerformanceBadge } from "@/components/ui/badge";
import { BuildingIcon } from "@/components/ui/icons";
import type { ObjektMitKennzahlen } from "@/lib/queries";

const levelLabels = {
  gut: "Auf Zielkurs",
  beobachten: "Beobachten",
  kritisch: "Unter Ziel",
  unbekannt: "Kein Ziel gesetzt",
};

export function ObjektCard({ objekt }: { objekt: ObjektMitKennzahlen }) {
  const level = performanceLevel(objekt.kennzahlen.abweichungProzent);
  const vermietungsquote = objekt.kennzahlen.anzahlWohnungen
    ? Math.round(
        (objekt.kennzahlen.anzahlVermietet / objekt.kennzahlen.anzahlWohnungen) * 100
      )
    : 0;

  return (
    <Link
      href={`/objekte/${objekt.id}`}
      className="card p-5 flex flex-col gap-3 hover:shadow-lg transition-shadow hover:border-[var(--brand)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand-strong)]">
            <BuildingIcon className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-semibold leading-tight">{objekt.name}</h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {objekt.strasse}, {objekt.plz} {objekt.ort}
            </p>
          </div>
        </div>
        <PerformanceBadge level={level} label={levelLabels[level]} />
      </div>

      {objekt.lage && (
        <p className="text-xs text-[var(--muted)] line-clamp-2">{objekt.lage}</p>
      )}

      <div className="grid grid-cols-2 gap-3 mt-1 text-sm">
        <div>
          <div className="text-[var(--muted)] text-xs">Nettokaltmiete</div>
          <div className="font-semibold tabular-nums">
            {formatEuro(objekt.kennzahlen.gesamtKaltmiete)}
          </div>
        </div>
        <div>
          <div className="text-[var(--muted)] text-xs">Ø Miete/m²</div>
          <div className="font-semibold tabular-nums">
            {objekt.kennzahlen.istProQmSchnitt.toFixed(2)} €
          </div>
        </div>
        <div>
          <div className="text-[var(--muted)] text-xs">Cashflow/Monat</div>
          <div
            className="font-semibold tabular-nums"
            style={{
              color:
                objekt.kennzahlen.cashflowMonatlich >= 0
                  ? "var(--good)"
                  : "var(--bad)",
            }}
          >
            {formatEuro(objekt.kennzahlen.cashflowMonatlich)}
          </div>
        </div>
        <div>
          <div className="text-[var(--muted)] text-xs">Vermietet</div>
          <div className="font-semibold tabular-nums">
            {objekt.kennzahlen.anzahlVermietet}/{objekt.kennzahlen.anzahlWohnungen} ({vermietungsquote}%)
          </div>
        </div>
      </div>
    </Link>
  );
}
