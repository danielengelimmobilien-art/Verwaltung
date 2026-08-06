import { deleteKontakt } from "@/lib/actions";
import { DeleteButton } from "@/components/ui/delete-button";
import { EditKontaktButton } from "@/components/forms/kontakt-form";
import { Badge } from "@/components/ui/badge";
import type { Kontakt } from "@/generated/prisma/client";

export function KontaktCard({
  kontakt,
  objekte,
  zeigeObjektBadge = true,
}: {
  kontakt: Kontakt & { objekt: { id: string; name: string } | null };
  objekte: { id: string; name: string }[];
  zeigeObjektBadge?: boolean;
}) {
  return (
    <div className="card p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold">{kontakt.name}</div>
          {kontakt.ansprechpartner && (
            <div className="text-xs text-[var(--muted)]">{kontakt.ansprechpartner}</div>
          )}
        </div>
        {zeigeObjektBadge && (
          <Badge tone={kontakt.objekt ? "brand" : "neutral"}>
            {kontakt.objekt ? kontakt.objekt.name : "Portfolioweit"}
          </Badge>
        )}
      </div>
      <div className="text-sm flex flex-col gap-0.5">
        {kontakt.telefon && <div>{kontakt.telefon}</div>}
        {kontakt.email && <div>{kontakt.email}</div>}
        {kontakt.adresse && <div className="text-[var(--muted)]">{kontakt.adresse}</div>}
      </div>
      {kontakt.notizen && <p className="text-xs text-[var(--muted)]">{kontakt.notizen}</p>}
      <div className="flex items-center gap-3 mt-1 pt-2 border-t border-[var(--border)]">
        <EditKontaktButton kontakt={kontakt} objekte={objekte} />
        <DeleteButton
          action={deleteKontakt.bind(null, kontakt.id)}
          confirmText={`Kontakt "${kontakt.name}" wirklich löschen?`}
        />
      </div>
    </div>
  );
}
