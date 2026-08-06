"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { warmmiete } from "@/lib/calc";
import {
  getAccessToken,
  listInstitutions,
  createAgreement,
  createRequisition,
  getRequisition,
  getAccountDetails,
  getAccountTransactions,
  deleteRequisition,
  pruefeGoCardlessKonfiguration,
} from "@/lib/gocardless";
import { findeZahlungsKandidat, findeObjektKandidat } from "@/lib/payment-matching";
import { extrahiereTextAusPdf, parseKontoauszugText } from "@/lib/pdf-import";

function str(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  if (raw === null) return null;
  const s = String(raw).trim();
  return s === "" ? null : s;
}

async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function ladeInstitutionen(country: string) {
  pruefeGoCardlessKonfiguration();
  const token = await getAccessToken();
  const institute = await listInstitutions(token, country);
  return institute
    .map((i) => ({ id: i.id, name: i.name }))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
}

// ---------- Verbindung herstellen ----------

export async function starteBankverbindung(formData: FormData) {
  pruefeGoCardlessKonfiguration();

  const institutionId = str(formData, "institutionId");
  const institutionName = str(formData, "institutionName");
  const bezeichnung = str(formData, "bezeichnung") ?? institutionName ?? "Bankkonto";
  const objektId = str(formData, "objektId");

  if (!institutionId) {
    throw new Error("Bitte eine Bank auswählen.");
  }

  const token = await getAccessToken();
  const agreement = await createAgreement(token, institutionId);

  const bankkonto = await prisma.bankkonto.create({
    data: {
      bezeichnung,
      institutionId,
      institutionName,
      objektId,
      status: "ausstehend",
    },
  });

  const origin = await getOrigin();

  let requisition;
  try {
    requisition = await createRequisition(token, {
      institutionId,
      agreementId: agreement.id,
      redirectUrl: `${origin}/api/gocardless/callback?req=${bankkonto.id}`,
      reference: bankkonto.id,
    });
  } catch (err) {
    await prisma.bankkonto.update({
      where: { id: bankkonto.id },
      data: {
        status: "fehler",
        fehler: err instanceof Error ? err.message : "Verbindung konnte nicht gestartet werden.",
      },
    });
    revalidatePath("/zahlungen");
    throw err;
  }

  await prisma.bankkonto.update({
    where: { id: bankkonto.id },
    data: { requisitionId: requisition.id },
  });

  revalidatePath("/zahlungen");
  redirect(requisition.link);
}

// ---------- Rückkehr von der Bank abschließen ----------

export async function finalisiereBankverbindung(bankkontoId: string) {
  const bankkonto = await prisma.bankkonto.findUnique({ where: { id: bankkontoId } });
  if (!bankkonto || !bankkonto.requisitionId || bankkonto.status === "verbunden") {
    return;
  }

  try {
    const token = await getAccessToken();
    const requisition = await getRequisition(token, bankkonto.requisitionId);

    if (!requisition.accounts || requisition.accounts.length === 0) {
      await prisma.bankkonto.update({
        where: { id: bankkonto.id },
        data: {
          status: "fehler",
          fehler: "Keine Konten von der Bank erhalten (Vorgang evtl. abgebrochen).",
        },
      });
      return;
    }

    const [ersteAccountId, ...weitere] = requisition.accounts;
    const details = await getAccountDetails(token, ersteAccountId).catch(() => null);

    await prisma.bankkonto.update({
      where: { id: bankkonto.id },
      data: {
        status: "verbunden",
        gocardlessAccountId: ersteAccountId,
        iban: details?.account?.iban ?? null,
        kontoinhaber: details?.account?.ownerName ?? details?.account?.name ?? null,
        fehler: null,
      },
    });

    for (const accountId of weitere) {
      const extraDetails = await getAccountDetails(token, accountId).catch(() => null);
      await prisma.bankkonto.create({
        data: {
          bezeichnung: `${bankkonto.bezeichnung} (${
            extraDetails?.account?.iban?.slice(-4) ?? "weiteres Konto"
          })`,
          institutionId: bankkonto.institutionId,
          institutionName: bankkonto.institutionName,
          objektId: bankkonto.objektId,
          requisitionId: bankkonto.requisitionId,
          gocardlessAccountId: accountId,
          status: "verbunden",
          iban: extraDetails?.account?.iban ?? null,
          kontoinhaber: extraDetails?.account?.ownerName ?? null,
        },
      });
    }

    await synchronisiereBankkonto(bankkonto.id);
  } catch (err) {
    await prisma.bankkonto.update({
      where: { id: bankkonto.id },
      data: {
        status: "fehler",
        fehler:
          err instanceof Error ? err.message : "Unbekannter Fehler beim Verbinden des Kontos.",
      },
    });
  }

  revalidatePath("/zahlungen");
}

// ---------- Synchronisierung & automatische Zuordnung ----------

async function ordneZahlungenAutomatischZu(bankkonto: { id: string; objektId: string | null }) {
  const unzugeordnete = await prisma.kontobewegung.findMany({
    where: { bankkontoId: bankkonto.id, mietverhaeltnisId: null, betrag: { gt: 0 } },
  });
  if (unzugeordnete.length === 0) return;

  const mietverhaeltnisse = await prisma.mietverhaeltnis.findMany({
    where: {
      aktiv: true,
      auszugsdatum: null,
      wohnung: bankkonto.objektId ? { objektId: bankkonto.objektId } : undefined,
    },
  });

  const kandidaten = mietverhaeltnisse.map((mv) => ({
    id: mv.id,
    mieterName: mv.mieterName,
    kaltmiete: mv.kaltmiete,
    warmmiete: warmmiete(mv.kaltmiete, mv.betriebskostenVorauszahlung, mv.heizkostenVorauszahlung),
  }));

  for (const bewegung of unzugeordnete) {
    const text = `${bewegung.absender ?? ""} ${bewegung.verwendungszweck ?? ""}`;
    const treffer = findeZahlungsKandidat(bewegung.betrag, text, kandidaten);
    if (treffer) {
      await prisma.kontobewegung.update({
        where: { id: bewegung.id },
        data: { mietverhaeltnisId: treffer, automatischZugeordnet: true },
      });
    }
  }
}

/** Ordnet unzugeordnete Ausgaben (negative Beträge) eines Kontos einem Objekt
 * zu - für die Betriebskostenabrechnung. Ist das Konto bereits einem Objekt
 * zugeordnet, gilt das direkt für alle Ausgaben; sonst wird per Freitext
 * (Objektname/Straße/Ort) versucht, eindeutig zuzuordnen. */
async function ordneBetriebskostenAutomatischZu(bankkontoId: string) {
  const bankkonto = await prisma.bankkonto.findUniqueOrThrow({ where: { id: bankkontoId } });
  const unzugeordnete = await prisma.kontobewegung.findMany({
    where: { bankkontoId, mietverhaeltnisId: null, objektId: null, betrag: { lt: 0 } },
  });
  if (unzugeordnete.length === 0) return;

  if (bankkonto.objektId) {
    await prisma.kontobewegung.updateMany({
      where: { id: { in: unzugeordnete.map((u) => u.id) } },
      data: { objektId: bankkonto.objektId, automatischZugeordnet: true },
    });
    return;
  }

  const objekte = await prisma.objekt.findMany({
    select: { id: true, name: true, strasse: true, ort: true },
  });

  for (const bewegung of unzugeordnete) {
    const text = `${bewegung.absender ?? ""} ${bewegung.verwendungszweck ?? ""}`;
    const treffer = findeObjektKandidat(text, objekte);
    if (treffer) {
      await prisma.kontobewegung.update({
        where: { id: bewegung.id },
        data: { objektId: treffer, automatischZugeordnet: true },
      });
    }
  }
}

export async function synchronisiereBankkonto(bankkontoId: string) {
  const bankkonto = await prisma.bankkonto.findUniqueOrThrow({ where: { id: bankkontoId } });
  if (!bankkonto.gocardlessAccountId) {
    throw new Error("Dieses Bankkonto ist noch nicht verbunden.");
  }

  const token = await getAccessToken();
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - 180);

  let transactions;
  try {
    transactions = await getAccountTransactions(
      token,
      bankkonto.gocardlessAccountId,
      dateFrom.toISOString().slice(0, 10)
    );
  } catch (err) {
    await prisma.bankkonto.update({
      where: { id: bankkonto.id },
      data: { fehler: err instanceof Error ? err.message : "Synchronisierung fehlgeschlagen." },
    });
    revalidatePath("/zahlungen");
    throw err;
  }

  for (const tx of transactions.booked) {
    const externeId = tx.transactionId ?? tx.internalTransactionId;
    const datum = tx.bookingDate ?? tx.valueDate;
    if (!externeId || !datum) continue;

    const verwendungszweck =
      tx.remittanceInformationUnstructured ??
      (tx.remittanceInformationUnstructuredArray?.length
        ? tx.remittanceInformationUnstructuredArray.join(" ")
        : null);

    await prisma.kontobewegung.upsert({
      where: { bankkontoId_externeId: { bankkontoId: bankkonto.id, externeId } },
      update: {},
      create: {
        bankkontoId: bankkonto.id,
        externeId,
        datum: new Date(datum),
        betrag: Number(tx.transactionAmount?.amount ?? 0),
        waehrung: tx.transactionAmount?.currency ?? "EUR",
        verwendungszweck,
        absender: tx.debtorName ?? null,
      },
    });
  }

  await prisma.bankkonto.update({
    where: { id: bankkonto.id },
    data: { letzterSync: new Date(), fehler: null },
  });

  await ordneZahlungenAutomatischZu({ id: bankkonto.id, objektId: bankkonto.objektId });
  await ordneBetriebskostenAutomatischZu(bankkonto.id);

  revalidatePath("/zahlungen");
}

// ---------- PDF-Kontoauszug-Import ----------

export type AnalysierteZeile = {
  datum: string;
  betrag: number;
  verwendungszweck: string;
  vorzeichenErkannt: boolean;
};

export async function analysiereKontoauszug(
  formData: FormData
): Promise<{ zeilen: AnalysierteZeile[] }> {
  const datei = formData.get("datei");
  if (!(datei instanceof File) || datei.size === 0) {
    throw new Error("Bitte eine PDF-Datei auswählen.");
  }

  const bytes = await datei.arrayBuffer();
  const text = await extrahiereTextAusPdf(Buffer.from(bytes));
  const buchungen = parseKontoauszugText(text);

  if (buchungen.length === 0) {
    throw new Error(
      "Es konnten keine Buchungen erkannt werden. Das PDF-Format dieser Bank wird von der automatischen Erkennung evtl. nicht unterstützt."
    );
  }

  return {
    zeilen: buchungen.map((b) => ({
      datum: b.datum.toISOString().slice(0, 10),
      betrag: Math.round(b.betrag * 100) / 100,
      verwendungszweck: b.verwendungszweck,
      vorzeichenErkannt: b.vorzeichenErkannt,
    })),
  };
}

export async function importiereKontobewegungen(
  formData: FormData
): Promise<{ anzahl: number }> {
  const bankkontoIdRoh = str(formData, "bankkontoId");
  const neueBezeichnung = str(formData, "neueBezeichnung");
  const neuesObjektId = str(formData, "neuesObjektId");
  const zeilenJson = formData.get("zeilen");

  if (typeof zeilenJson !== "string") {
    throw new Error("Keine Buchungen übermittelt.");
  }

  const zeilen: { datum: string; betrag: number; verwendungszweck: string }[] =
    JSON.parse(zeilenJson);
  if (zeilen.length === 0) {
    throw new Error("Keine Buchungen zum Importieren ausgewählt.");
  }

  let bankkontoId = bankkontoIdRoh;
  if (!bankkontoId) {
    const neu = await prisma.bankkonto.create({
      data: {
        bezeichnung: neueBezeichnung || "Manuelles Konto (PDF-Import)",
        quelle: "manuell",
        status: "manuell",
        objektId: neuesObjektId,
      },
    });
    bankkontoId = neu.id;
  }

  for (const z of zeilen) {
    const datum = new Date(z.datum);
    if (Number.isNaN(datum.getTime())) continue;

    const externeId = createHash("sha256")
      .update(`${z.datum}|${z.betrag.toFixed(2)}|${z.verwendungszweck}`)
      .digest("hex")
      .slice(0, 40);

    await prisma.kontobewegung.upsert({
      where: { bankkontoId_externeId: { bankkontoId, externeId } },
      update: {},
      create: {
        bankkontoId,
        externeId,
        quelle: "pdf_import",
        datum,
        betrag: z.betrag,
        verwendungszweck: z.verwendungszweck,
      },
    });
  }

  await prisma.bankkonto.update({
    where: { id: bankkontoId },
    data: { letzterSync: new Date() },
  });

  const bankkonto = await prisma.bankkonto.findUniqueOrThrow({ where: { id: bankkontoId } });
  await ordneZahlungenAutomatischZu({ id: bankkonto.id, objektId: bankkonto.objektId });
  await ordneBetriebskostenAutomatischZu(bankkonto.id);

  revalidatePath("/zahlungen");
  return { anzahl: zeilen.length };
}

// ---------- Verwaltung ----------

export async function bankkontoTrennen(id: string) {
  const bankkonto = await prisma.bankkonto.findUnique({ where: { id } });
  if (bankkonto?.requisitionId) {
    try {
      const token = await getAccessToken();
      await deleteRequisition(token, bankkonto.requisitionId);
    } catch {
      // Trennung lokal trotzdem durchführen, auch wenn der Widerruf bei
      // GoCardless fehlschlägt (z.B. bereits abgelaufen).
    }
  }
  await prisma.bankkonto.delete({ where: { id } });
  revalidatePath("/zahlungen");
}

export async function zahlungZuordnen(kontobewegungId: string, formData: FormData) {
  const mietverhaeltnisId = str(formData, "mietverhaeltnisId");
  const objektId = str(formData, "objektId");
  const bkKategorie = str(formData, "bkKategorie");

  if (mietverhaeltnisId) {
    await prisma.kontobewegung.update({
      where: { id: kontobewegungId },
      data: {
        mietverhaeltnisId,
        objektId: null,
        bkKategorie: null,
        automatischZugeordnet: false,
      },
    });
  } else if (objektId) {
    await prisma.kontobewegung.update({
      where: { id: kontobewegungId },
      data: {
        objektId,
        bkKategorie: bkKategorie ?? "Sonstiges",
        mietverhaeltnisId: null,
        automatischZugeordnet: false,
      },
    });
  }
  revalidatePath("/zahlungen");
}

export async function zahlungZuordnungAufheben(kontobewegungId: string) {
  await prisma.kontobewegung.update({
    where: { id: kontobewegungId },
    data: {
      mietverhaeltnisId: null,
      objektId: null,
      bkKategorie: null,
      automatischZugeordnet: false,
    },
  });
  revalidatePath("/zahlungen");
}
