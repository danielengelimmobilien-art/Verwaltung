"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { extrahiereTextAusPdf } from "@/lib/pdf-import";
import { parseRechnungText, type ErkannteRechnung } from "@/lib/beleg-parsing";
import { findeKontobewegungFuerBeleg } from "@/lib/payment-matching";

function str(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  if (raw === null) return null;
  const s = String(raw).trim();
  return s === "" ? null : s;
}

function num(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (raw === null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export async function analysiereBeleg(formData: FormData): Promise<ErkannteRechnung> {
  const datei = formData.get("datei");
  if (!(datei instanceof File) || datei.size === 0) {
    throw new Error("Bitte eine PDF-Datei auswählen.");
  }

  const bytes = await datei.arrayBuffer();
  const text = await extrahiereTextAusPdf(Buffer.from(bytes));
  return parseRechnungText(text);
}

async function versucheAutomatischesMatching(belegId: string) {
  const beleg = await prisma.beleg.findUniqueOrThrow({ where: { id: belegId } });
  if (beleg.kontobewegungId) return;

  const freieBewegungen = await prisma.kontobewegung.findMany({
    where: {
      beleg: { is: null },
      betrag: { lt: 0 },
      bankkonto: beleg.objektId ? { OR: [{ objektId: beleg.objektId }, { objektId: null }] } : {},
    },
  });

  const treffer = findeKontobewegungFuerBeleg(
    beleg.betrag,
    beleg.rechnungsdatum,
    beleg.aussteller,
    freieBewegungen.map((b) => ({
      id: b.id,
      betrag: b.betrag,
      datum: b.datum,
      absender: b.absender,
      verwendungszweck: b.verwendungszweck,
    }))
  );

  if (treffer) {
    await prisma.beleg.update({
      where: { id: belegId },
      data: { kontobewegungId: treffer, status: "bezahlt", automatischZugeordnet: true },
    });
  }
}

export async function createBeleg(formData: FormData) {
  const aussteller = str(formData, "aussteller");
  const rechnungsdatumRoh = str(formData, "rechnungsdatum");
  const betrag = num(formData, "betrag");

  if (!aussteller) throw new Error("Bitte einen Aussteller angeben.");
  if (!rechnungsdatumRoh) throw new Error("Bitte ein Rechnungsdatum angeben.");
  if (betrag === null) throw new Error("Bitte einen Betrag angeben.");

  const beleg = await prisma.beleg.create({
    data: {
      aussteller,
      rechnungsnummer: str(formData, "rechnungsnummer"),
      rechnungsdatum: new Date(rechnungsdatumRoh),
      betrag,
      beschreibung: str(formData, "beschreibung"),
      objektId: str(formData, "objektId"),
      bkKategorie: str(formData, "bkKategorie"),
      notizen: str(formData, "notizen"),
    },
  });

  await versucheAutomatischesMatching(beleg.id);

  revalidatePath("/zahlungen");
}

export async function updateBeleg(id: string, formData: FormData) {
  await prisma.beleg.update({
    where: { id },
    data: {
      aussteller: str(formData, "aussteller") ?? undefined,
      rechnungsnummer: str(formData, "rechnungsnummer"),
      rechnungsdatum: (() => {
        const d = str(formData, "rechnungsdatum");
        return d ? new Date(d) : undefined;
      })(),
      betrag: num(formData, "betrag") ?? undefined,
      beschreibung: str(formData, "beschreibung"),
      objektId: str(formData, "objektId"),
      bkKategorie: str(formData, "bkKategorie"),
      notizen: str(formData, "notizen"),
    },
  });
  revalidatePath("/zahlungen");
}

export async function deleteBeleg(id: string) {
  await prisma.beleg.delete({ where: { id } });
  revalidatePath("/zahlungen");
}

export async function belegManuellVerknuepfen(belegId: string, formData: FormData) {
  const kontobewegungId = str(formData, "kontobewegungId");
  if (!kontobewegungId) return;

  const bereitsVerknuepft = await prisma.beleg.findFirst({
    where: { kontobewegungId },
  });
  if (bereitsVerknuepft && bereitsVerknuepft.id !== belegId) {
    throw new Error("Diese Kontobewegung ist bereits einem anderen Beleg zugeordnet.");
  }

  await prisma.beleg.update({
    where: { id: belegId },
    data: { kontobewegungId, status: "bezahlt", automatischZugeordnet: false },
  });
  revalidatePath("/zahlungen");
}

export async function belegVerknuepfungAufheben(belegId: string) {
  await prisma.beleg.update({
    where: { id: belegId },
    data: { kontobewegungId: null, status: "offen", automatischZugeordnet: false },
  });
  revalidatePath("/zahlungen");
}

export async function belegStatusUmschalten(belegId: string) {
  const beleg = await prisma.beleg.findUniqueOrThrow({ where: { id: belegId } });
  await prisma.beleg.update({
    where: { id: belegId },
    data: { status: beleg.status === "offen" ? "bezahlt" : "offen" },
  });
  revalidatePath("/zahlungen");
}
