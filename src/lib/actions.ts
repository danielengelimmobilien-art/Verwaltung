"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function num(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (raw === null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function str(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  if (raw === null) return null;
  const s = String(raw).trim();
  return s === "" ? null : s;
}

function date(formData: FormData, key: string): Date | null {
  const s = str(formData, key);
  return s ? new Date(s) : null;
}

// ---------- Objekt ----------

export async function createObjekt(formData: FormData) {
  const objekt = await prisma.objekt.create({
    data: {
      name: str(formData, "name") ?? "Neues Objekt",
      strasse: str(formData, "strasse") ?? "",
      plz: str(formData, "plz") ?? "",
      ort: str(formData, "ort") ?? "",
      lage: str(formData, "lage"),
      baujahr: num(formData, "baujahr"),
      kaufpreis: num(formData, "kaufpreis"),
      kaufdatum: date(formData, "kaufdatum"),
      darlehenssumme: num(formData, "darlehenssumme"),
      zinssatzProzent: num(formData, "zinssatzProzent"),
      tilgungProzent: num(formData, "tilgungProzent"),
      bankrateMonatlich: num(formData, "bankrateMonatlich"),
      bankName: str(formData, "bankName"),
      notizen: str(formData, "notizen"),
    },
  });
  revalidatePath("/");
  revalidatePath("/objekte");
  redirect(`/objekte/${objekt.id}`);
}

export async function updateObjekt(id: string, formData: FormData) {
  await prisma.objekt.update({
    where: { id },
    data: {
      name: str(formData, "name") ?? undefined,
      strasse: str(formData, "strasse") ?? undefined,
      plz: str(formData, "plz") ?? undefined,
      ort: str(formData, "ort") ?? undefined,
      lage: str(formData, "lage"),
      baujahr: num(formData, "baujahr"),
      kaufpreis: num(formData, "kaufpreis"),
      kaufdatum: date(formData, "kaufdatum"),
      darlehenssumme: num(formData, "darlehenssumme"),
      zinssatzProzent: num(formData, "zinssatzProzent"),
      tilgungProzent: num(formData, "tilgungProzent"),
      bankrateMonatlich: num(formData, "bankrateMonatlich"),
      bankName: str(formData, "bankName"),
      notizen: str(formData, "notizen"),
    },
  });
  revalidatePath("/");
  revalidatePath("/objekte");
  revalidatePath(`/objekte/${id}`);
}

export async function deleteObjekt(id: string) {
  await prisma.objekt.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/objekte");
  redirect("/objekte");
}

// ---------- Wohnung ----------

export async function createWohnung(objektId: string, formData: FormData) {
  await prisma.wohnung.create({
    data: {
      objektId,
      bezeichnung: str(formData, "bezeichnung") ?? "Neue Wohnung",
      lageImObjekt: str(formData, "lageImObjekt") ?? "",
      groesseQm: num(formData, "groesseQm") ?? 0,
      zimmer: num(formData, "zimmer"),
      zielmieteProQm: num(formData, "zielmieteProQm"),
      notizen: str(formData, "notizen"),
    },
  });
  revalidatePath("/");
  revalidatePath(`/objekte/${objektId}`);
  revalidatePath("/mieter");
}

export async function updateWohnung(id: string, formData: FormData) {
  const wohnung = await prisma.wohnung.update({
    where: { id },
    data: {
      bezeichnung: str(formData, "bezeichnung") ?? undefined,
      lageImObjekt: str(formData, "lageImObjekt") ?? undefined,
      groesseQm: num(formData, "groesseQm") ?? undefined,
      zimmer: num(formData, "zimmer"),
      zielmieteProQm: num(formData, "zielmieteProQm"),
      notizen: str(formData, "notizen"),
    },
  });
  revalidatePath("/");
  revalidatePath(`/objekte/${wohnung.objektId}`);
  revalidatePath("/mieter");
}

export async function deleteWohnung(id: string, objektId: string) {
  await prisma.wohnung.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath(`/objekte/${objektId}`);
  revalidatePath("/mieter");
}

// ---------- Mietverhältnis ----------

export async function createMietverhaeltnis(
  wohnungId: string,
  objektId: string,
  formData: FormData
) {
  // laufende Mietverhältnisse dieser Wohnung beenden, bevor ein neues beginnt
  await prisma.mietverhaeltnis.updateMany({
    where: { wohnungId, aktiv: true, auszugsdatum: null },
    data: { aktiv: false, auszugsdatum: date(formData, "einzugsdatum") },
  });

  await prisma.mietverhaeltnis.create({
    data: {
      wohnungId,
      mieterName: str(formData, "mieterName") ?? "",
      telefon: str(formData, "telefon"),
      email: str(formData, "email"),
      einzugsdatum: date(formData, "einzugsdatum") ?? new Date(),
      kaution: num(formData, "kaution"),
      kaltmiete: num(formData, "kaltmiete") ?? 0,
      betriebskostenVorauszahlung: num(formData, "betriebskosten"),
      heizkostenVorauszahlung: num(formData, "heizkosten"),
      notizen: str(formData, "notizen"),
    },
  });
  revalidatePath("/");
  revalidatePath(`/objekte/${objektId}`);
  revalidatePath("/mieter");
}

export async function updateMietverhaeltnis(
  id: string,
  objektId: string,
  formData: FormData
) {
  await prisma.mietverhaeltnis.update({
    where: { id },
    data: {
      mieterName: str(formData, "mieterName") ?? undefined,
      telefon: str(formData, "telefon"),
      email: str(formData, "email"),
      einzugsdatum: date(formData, "einzugsdatum") ?? undefined,
      kaution: num(formData, "kaution"),
      kaltmiete: num(formData, "kaltmiete") ?? undefined,
      betriebskostenVorauszahlung: num(formData, "betriebskosten"),
      heizkostenVorauszahlung: num(formData, "heizkosten"),
      notizen: str(formData, "notizen"),
    },
  });
  revalidatePath("/");
  revalidatePath(`/objekte/${objektId}`);
  revalidatePath("/mieter");
}

export async function beendeMietverhaeltnis(
  id: string,
  objektId: string,
  formData: FormData
) {
  await prisma.mietverhaeltnis.update({
    where: { id },
    data: {
      aktiv: false,
      auszugsdatum: date(formData, "auszugsdatum") ?? new Date(),
    },
  });
  revalidatePath("/");
  revalidatePath(`/objekte/${objektId}`);
  revalidatePath("/mieter");
}

// ---------- Mieterhöhung ----------

export async function createMieterhoehung(
  mietverhaeltnisId: string,
  objektId: string,
  formData: FormData
) {
  const mietverhaeltnis = await prisma.mietverhaeltnis.findUniqueOrThrow({
    where: { id: mietverhaeltnisId },
  });

  const neueKaltmiete = num(formData, "neueKaltmiete") ?? mietverhaeltnis.kaltmiete;

  await prisma.$transaction([
    prisma.mieterhoehung.create({
      data: {
        mietverhaeltnisId,
        datum: date(formData, "datum") ?? new Date(),
        alteKaltmiete: mietverhaeltnis.kaltmiete,
        neueKaltmiete,
        grund: str(formData, "grund"),
      },
    }),
    prisma.mietverhaeltnis.update({
      where: { id: mietverhaeltnisId },
      data: { kaltmiete: neueKaltmiete },
    }),
  ]);

  revalidatePath("/");
  revalidatePath(`/objekte/${objektId}`);
  revalidatePath("/mieter");
}

// ---------- Sanierung ----------

export async function createSanierung(objektId: string, formData: FormData) {
  await prisma.sanierung.create({
    data: {
      objektId,
      titel: str(formData, "titel") ?? "Neue Maßnahme",
      kategorie: str(formData, "kategorie") ?? "Sonstiges",
      datum: date(formData, "datum") ?? new Date(),
      beschreibung: str(formData, "beschreibung"),
      kosten: num(formData, "kosten"),
      status: str(formData, "status") ?? "geplant",
      belegHinweis: str(formData, "belegHinweis"),
    },
  });
  revalidatePath("/sanierung");
  revalidatePath(`/objekte/${objektId}`);
}

export async function updateSanierung(
  id: string,
  objektId: string,
  formData: FormData
) {
  await prisma.sanierung.update({
    where: { id },
    data: {
      titel: str(formData, "titel") ?? undefined,
      kategorie: str(formData, "kategorie") ?? undefined,
      datum: date(formData, "datum") ?? undefined,
      beschreibung: str(formData, "beschreibung"),
      kosten: num(formData, "kosten"),
      status: str(formData, "status") ?? undefined,
      belegHinweis: str(formData, "belegHinweis"),
    },
  });
  revalidatePath("/sanierung");
  revalidatePath(`/objekte/${objektId}`);
}

export async function deleteSanierung(id: string, objektId: string) {
  await prisma.sanierung.delete({ where: { id } });
  revalidatePath("/sanierung");
  revalidatePath(`/objekte/${objektId}`);
}

// ---------- Kontakt ----------

export async function createKontakt(formData: FormData) {
  await prisma.kontakt.create({
    data: {
      kategorie: str(formData, "kategorie") ?? "Sonstiges",
      name: str(formData, "name") ?? "Neuer Kontakt",
      ansprechpartner: str(formData, "ansprechpartner"),
      telefon: str(formData, "telefon"),
      email: str(formData, "email"),
      adresse: str(formData, "adresse"),
      notizen: str(formData, "notizen"),
      objektId: str(formData, "objektId"),
    },
  });
  revalidatePath("/kontakte");
}

export async function updateKontakt(id: string, formData: FormData) {
  await prisma.kontakt.update({
    where: { id },
    data: {
      kategorie: str(formData, "kategorie") ?? undefined,
      name: str(formData, "name") ?? undefined,
      ansprechpartner: str(formData, "ansprechpartner"),
      telefon: str(formData, "telefon"),
      email: str(formData, "email"),
      adresse: str(formData, "adresse"),
      notizen: str(formData, "notizen"),
      objektId: str(formData, "objektId"),
    },
  });
  revalidatePath("/kontakte");
}

export async function deleteKontakt(id: string) {
  await prisma.kontakt.delete({ where: { id } });
  revalidatePath("/kontakte");
}
