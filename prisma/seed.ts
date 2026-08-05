import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Lösche vorhandene Beispieldaten...");
  await prisma.mieterhoehung.deleteMany();
  await prisma.mietverhaeltnis.deleteMany();
  await prisma.sanierung.deleteMany();
  await prisma.wohnung.deleteMany();
  await prisma.objekt.deleteMany();

  console.log("Lege Objekt 1 an: Mehrfamilienhaus Lindenstraße 12...");
  const mfh = await prisma.objekt.create({
    data: {
      name: "MFH Lindenstraße 12",
      strasse: "Lindenstraße 12",
      plz: "04103",
      ort: "Leipzig",
      lage: "Zentrumsnahe Lage, ruhige Seitenstraße, gute ÖPNV-Anbindung, Sanierungsgebiet",
      baujahr: 1905,
      kaufpreis: 620000,
      kaufdatum: new Date("2019-06-01"),
      darlehenssumme: 480000,
      zinssatzProzent: 3.4,
      tilgungProzent: 2,
      bankrateMonatlich: 2160,
      bankName: "Sparkasse Leipzig",
      notizen: "6 Einheiten, Vollvermietung angestrebt bis Q4.",
    },
  });

  const whgErdgeschoss = await prisma.wohnung.create({
    data: {
      objektId: mfh.id,
      bezeichnung: "Whg 1",
      lageImObjekt: "EG links",
      groesseQm: 62,
      zimmer: 2,
      zielmieteProQm: 8.5,
      notizen: "Mit Terrasse zum Innenhof",
    },
  });

  const whg1OgLinks = await prisma.wohnung.create({
    data: {
      objektId: mfh.id,
      bezeichnung: "Whg 2",
      lageImObjekt: "1. OG links",
      groesseQm: 68,
      zimmer: 3,
      zielmieteProQm: 9,
    },
  });

  const whg1OgRechts = await prisma.wohnung.create({
    data: {
      objektId: mfh.id,
      bezeichnung: "Whg 3",
      lageImObjekt: "1. OG rechts",
      groesseQm: 55,
      zimmer: 2,
      zielmieteProQm: 9,
    },
  });

  const whg2OgLinks = await prisma.wohnung.create({
    data: {
      objektId: mfh.id,
      bezeichnung: "Whg 4",
      lageImObjekt: "2. OG links",
      groesseQm: 68,
      zimmer: 3,
      zielmieteProQm: 9,
    },
  });

  await prisma.wohnung.create({
    data: {
      objektId: mfh.id,
      bezeichnung: "Whg 5",
      lageImObjekt: "2. OG rechts",
      groesseQm: 55,
      zimmer: 2,
      zielmieteProQm: 9,
      notizen: "Aktuell unvermietet – wird renoviert",
    },
  });

  const whgDach = await prisma.wohnung.create({
    data: {
      objektId: mfh.id,
      bezeichnung: "Whg 6",
      lageImObjekt: "Dachgeschoss",
      groesseQm: 78,
      zimmer: 3.5,
      zielmieteProQm: 10,
      notizen: "Ausgebaut 2021, Dachschrägen",
    },
  });

  // Mietverhältnisse MFH
  const mv1 = await prisma.mietverhaeltnis.create({
    data: {
      wohnungId: whgErdgeschoss.id,
      mieterName: "Familie Schulz",
      einzugsdatum: new Date("2020-03-01"),
      kaution: 1470,
      kaltmiete: 508,
      betriebskostenVorauszahlung: 95,
      heizkostenVorauszahlung: 70,
    },
  });
  await prisma.mieterhoehung.create({
    data: {
      mietverhaeltnisId: mv1.id,
      datum: new Date("2023-04-01"),
      alteKaltmiete: 465,
      neueKaltmiete: 508,
      grund: "Mietspiegelanpassung",
    },
  });

  const mv2 = await prisma.mietverhaeltnis.create({
    data: {
      wohnungId: whg1OgLinks.id,
      mieterName: "Herr Dr. Nowak",
      einzugsdatum: new Date("2018-09-15"),
      kaution: 1836,
      kaltmiete: 578,
      betriebskostenVorauszahlung: 105,
      heizkostenVorauszahlung: 80,
    },
  });
  await prisma.mieterhoehung.create({
    data: {
      mietverhaeltnisId: mv2.id,
      datum: new Date("2022-01-01"),
      alteKaltmiete: 540,
      neueKaltmiete: 560,
      grund: "Staffelmiete",
    },
  });
  await prisma.mieterhoehung.create({
    data: {
      mietverhaeltnisId: mv2.id,
      datum: new Date("2024-01-01"),
      alteKaltmiete: 560,
      neueKaltmiete: 578,
      grund: "Staffelmiete",
    },
  });

  await prisma.mietverhaeltnis.create({
    data: {
      wohnungId: whg1OgRechts.id,
      mieterName: "Frau Kaiser",
      einzugsdatum: new Date("2021-11-01"),
      kaution: 1350,
      kaltmiete: 495,
      betriebskostenVorauszahlung: 85,
      heizkostenVorauszahlung: 60,
    },
  });

  const mv4 = await prisma.mietverhaeltnis.create({
    data: {
      wohnungId: whg2OgLinks.id,
      mieterName: "Herr und Frau Petrov",
      einzugsdatum: new Date("2017-05-01"),
      kaution: 1500,
      kaltmiete: 510,
      betriebskostenVorauszahlung: 105,
      heizkostenVorauszahlung: 80,
    },
  });
  await prisma.mieterhoehung.create({
    data: {
      mietverhaeltnisId: mv4.id,
      datum: new Date("2021-06-01"),
      alteKaltmiete: 470,
      neueKaltmiete: 510,
      grund: "Mietspiegelanpassung nach Modernisierung",
    },
  });

  const mv6 = await prisma.mietverhaeltnis.create({
    data: {
      wohnungId: whgDach.id,
      mieterName: "Frau Albrecht",
      einzugsdatum: new Date("2021-09-01"),
      kaution: 2340,
      kaltmiete: 780,
      betriebskostenVorauszahlung: 120,
      heizkostenVorauszahlung: 95,
    },
  });
  await prisma.mieterhoehung.create({
    data: {
      mietverhaeltnisId: mv6.id,
      datum: new Date("2024-09-01"),
      alteKaltmiete: 741,
      neueKaltmiete: 780,
      grund: "Indexmiete",
    },
  });

  console.log("Lege Sanierungen für MFH an...");
  await prisma.sanierung.createMany({
    data: [
      {
        objektId: mfh.id,
        titel: "Dachsanierung inkl. Dämmung",
        kategorie: "Dach",
        datum: new Date("2021-05-15"),
        beschreibung: "Vollständige Neueindeckung, Aufsparrendämmung, Ausbau DG-Wohnung",
        kosten: 78000,
        status: "abgeschlossen",
        belegHinweis: "Ordner 'MFH Lindenstraße/Sanierung 2021/Dach'",
      },
      {
        objektId: mfh.id,
        titel: "Fenstertausch Vorderhaus",
        kategorie: "Fenster",
        datum: new Date("2022-08-01"),
        beschreibung: "Austausch aller Fenster Vorderhaus gegen 3-fach verglaste Fenster",
        kosten: 32500,
        status: "abgeschlossen",
        belegHinweis: "Ordner 'MFH Lindenstraße/Sanierung 2022/Fenster'",
      },
      {
        objektId: mfh.id,
        titel: "Heizungsmodernisierung (Gasbrennwert -> Wärmepumpe)",
        kategorie: "Heizung",
        datum: new Date("2026-04-01"),
        beschreibung: "Umstellung auf Wärmepumpe, Angebote werden eingeholt",
        kosten: 65000,
        status: "geplant",
      },
      {
        objektId: mfh.id,
        titel: "Renovierung Whg 5 (2. OG rechts)",
        kategorie: "Bad",
        datum: new Date("2026-07-01"),
        beschreibung: "Bad und Küche werden vor Neuvermietung erneuert",
        kosten: 14000,
        status: "in_arbeit",
        belegHinweis: "Ordner 'MFH Lindenstraße/Renovierung Whg5'",
      },
    ],
  });

  console.log("Lege Objekt 2 an: ETW Amselweg 5...");
  const etw = await prisma.objekt.create({
    data: {
      name: "ETW Amselweg 5",
      strasse: "Amselweg 5",
      plz: "01309",
      ort: "Dresden",
      lage: "Ruhige Wohnlage am Stadtrand, Nähe Elbwiesen, gute Grundschule fußläufig",
      baujahr: 1998,
      kaufpreis: 195000,
      kaufdatum: new Date("2021-02-01"),
      darlehenssumme: 150000,
      zinssatzProzent: 3.1,
      tilgungProzent: 2.5,
      bankrateMonatlich: 700,
      bankName: "DKB",
    },
  });

  const whgEtw = await prisma.wohnung.create({
    data: {
      objektId: etw.id,
      bezeichnung: "Whg (gesamt)",
      lageImObjekt: "3. OG links",
      groesseQm: 74,
      zimmer: 3,
      zielmieteProQm: 11,
    },
  });

  const mvEtw = await prisma.mietverhaeltnis.create({
    data: {
      wohnungId: whgEtw.id,
      mieterName: "Herr Vogel",
      einzugsdatum: new Date("2021-04-01"),
      kaution: 2220,
      kaltmiete: 740,
      betriebskostenVorauszahlung: 130,
      heizkostenVorauszahlung: 90,
    },
  });
  await prisma.mieterhoehung.create({
    data: {
      mietverhaeltnisId: mvEtw.id,
      datum: new Date("2024-04-01"),
      alteKaltmiete: 703,
      neueKaltmiete: 740,
      grund: "Vergleichsmiete",
    },
  });

  await prisma.sanierung.create({
    data: {
      objektId: etw.id,
      titel: "Neue Einbauküche",
      kategorie: "Sonstiges",
      datum: new Date("2023-03-10"),
      beschreibung: "Einbauküche auf Vermieterwunsch erneuert",
      kosten: 6200,
      status: "abgeschlossen",
    },
  });

  console.log("Seed abgeschlossen.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
