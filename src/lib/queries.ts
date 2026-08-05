import { prisma } from "@/lib/prisma";
import { mieteProQm, warmmiete, zielAbweichungProzent } from "@/lib/calc";

function aktivesMietverhaeltnis<
  T extends { aktiv: boolean; auszugsdatum: Date | null; einzugsdatum: Date }
>(mietverhaeltnisse: T[]): T | null {
  const aktive = mietverhaeltnisse.filter((m) => m.aktiv && !m.auszugsdatum);
  if (aktive.length === 0) return null;
  return aktive.sort(
    (a, b) => b.einzugsdatum.getTime() - a.einzugsdatum.getTime()
  )[0];
}

export async function getObjekteMitWohnungen() {
  const objekte = await prisma.objekt.findMany({
    include: {
      wohnungen: {
        include: {
          mietverhaeltnisse: {
            include: { mieterhoehungen: { orderBy: { datum: "desc" } } },
          },
        },
        orderBy: { lageImObjekt: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return objekte.map((objekt) => {
    const wohnungenBerechnet = objekt.wohnungen.map((wohnung) => {
      const aktuell = aktivesMietverhaeltnis(wohnung.mietverhaeltnisse);
      const kaltmiete = aktuell?.kaltmiete ?? 0;
      const istProQm = mieteProQm(kaltmiete, wohnung.groesseQm);
      const abweichung = zielAbweichungProzent(
        istProQm,
        wohnung.zielmieteProQm
      );
      const letzteMieterhoehung = aktuell?.mieterhoehungen[0] ?? null;
      return {
        ...wohnung,
        aktuellesMietverhaeltnis: aktuell,
        kaltmiete,
        istProQm,
        abweichungProzent: abweichung,
        letzteMieterhoehung,
        vermietet: !!aktuell,
      };
    });

    const gesamtGroesse = wohnungenBerechnet.reduce(
      (sum, w) => sum + w.groesseQm,
      0
    );
    const gesamtKaltmiete = wohnungenBerechnet.reduce(
      (sum, w) => sum + w.kaltmiete,
      0
    );
    const gesamtZielmiete = wohnungenBerechnet.reduce(
      (sum, w) => sum + (w.zielmieteProQm ?? 0) * w.groesseQm,
      0
    );
    const anzahlVermietet = wohnungenBerechnet.filter(
      (w) => w.vermietet
    ).length;
    const istProQmSchnitt = gesamtGroesse
      ? gesamtKaltmiete / gesamtGroesse
      : 0;
    const zielProQmSchnitt = gesamtGroesse
      ? gesamtZielmiete / gesamtGroesse
      : 0;
    const cashflowMonatlich =
      gesamtKaltmiete - (objekt.bankrateMonatlich ?? 0);

    return {
      ...objekt,
      wohnungen: wohnungenBerechnet,
      kennzahlen: {
        gesamtGroesse,
        gesamtKaltmiete,
        gesamtZielmiete,
        istProQmSchnitt,
        zielProQmSchnitt,
        abweichungProzent: zielAbweichungProzent(
          istProQmSchnitt,
          zielProQmSchnitt || null
        ),
        anzahlWohnungen: wohnungenBerechnet.length,
        anzahlVermietet,
        cashflowMonatlich,
      },
    };
  });
}

export async function getObjektMitWohnungen(id: string) {
  const alle = await getObjekteMitWohnungen();
  return alle.find((o) => o.id === id) ?? null;
}

export type ObjektMitKennzahlen = Awaited<
  ReturnType<typeof getObjekteMitWohnungen>
>[number];

export async function getPortfolioKennzahlen() {
  const objekte = await getObjekteMitWohnungen();

  const gesamtGroesse = objekte.reduce(
    (s, o) => s + o.kennzahlen.gesamtGroesse,
    0
  );
  const gesamtKaltmiete = objekte.reduce(
    (s, o) => s + o.kennzahlen.gesamtKaltmiete,
    0
  );
  const gesamtZielmiete = objekte.reduce(
    (s, o) => s + o.kennzahlen.gesamtZielmiete,
    0
  );
  const gesamtBankrate = objekte.reduce(
    (s, o) => s + (o.bankrateMonatlich ?? 0),
    0
  );
  const anzahlWohnungen = objekte.reduce(
    (s, o) => s + o.kennzahlen.anzahlWohnungen,
    0
  );
  const anzahlVermietet = objekte.reduce(
    (s, o) => s + o.kennzahlen.anzahlVermietet,
    0
  );
  const istProQmSchnitt = gesamtGroesse ? gesamtKaltmiete / gesamtGroesse : 0;
  const zielProQmSchnitt = gesamtGroesse
    ? gesamtZielmiete / gesamtGroesse
    : 0;

  return {
    objekte,
    gesamtGroesse,
    gesamtKaltmiete,
    gesamtZielmiete,
    gesamtBankrate,
    cashflowMonatlich: gesamtKaltmiete - gesamtBankrate,
    anzahlObjekte: objekte.length,
    anzahlWohnungen,
    anzahlVermietet,
    istProQmSchnitt,
    zielProQmSchnitt,
    abweichungProzent: zielAbweichungProzent(
      istProQmSchnitt,
      zielProQmSchnitt || null
    ),
  };
}

export async function getMieterUebersicht() {
  const wohnungen = await prisma.wohnung.findMany({
    include: {
      objekt: true,
      mietverhaeltnisse: {
        include: { mieterhoehungen: { orderBy: { datum: "desc" } } },
      },
    },
    orderBy: [{ objekt: { name: "asc" } }, { lageImObjekt: "asc" }],
  });

  return wohnungen.map((wohnung) => {
    const aktuell = aktivesMietverhaeltnis(wohnung.mietverhaeltnisse);
    const warm = aktuell
      ? warmmiete(
          aktuell.kaltmiete,
          aktuell.betriebskostenVorauszahlung,
          aktuell.heizkostenVorauszahlung
        )
      : null;
    return {
      wohnung,
      objekt: wohnung.objekt,
      mietverhaeltnis: aktuell,
      warmmiete: warm,
      letzteMieterhoehung: aktuell?.mieterhoehungen[0] ?? null,
    };
  });
}

export async function getObjektListe() {
  return prisma.objekt.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

const KONTAKT_KATEGORIEN = [
  "Elektrik",
  "Gas/Wasser/Sanitär",
  "Dachdecker",
  "Schornsteinfeger",
  "Hausverwaltung",
  "Sonstiges",
];

export async function getKontakteGruppiert() {
  const kontakte = await prisma.kontakt.findMany({
    include: { objekt: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });

  const kategorien = [
    ...KONTAKT_KATEGORIEN,
    ...Array.from(new Set(kontakte.map((k) => k.kategorie))).filter(
      (k) => !KONTAKT_KATEGORIEN.includes(k)
    ),
  ];

  return kategorien
    .map((kategorie) => ({
      kategorie,
      kontakte: kontakte.filter((k) => k.kategorie === kategorie),
    }))
    .filter((gruppe) => gruppe.kontakte.length > 0);
}

export async function getSanierungenNachObjekt() {
  const objekte = await prisma.objekt.findMany({
    include: {
      sanierungen: { orderBy: { datum: "desc" } },
    },
    orderBy: { name: "asc" },
  });

  return objekte.map((objekt) => ({
    objekt,
    sanierungen: objekt.sanierungen,
    summeKosten: objekt.sanierungen.reduce((s, x) => s + (x.kosten ?? 0), 0),
  }));
}

// ---------- Bankkonten & Zahlungsprüfung ----------

export async function getBankkonten() {
  return prisma.bankkonto.findMany({
    include: { objekt: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export type ZahlungsStatus = "bezahlt" | "teilweise" | "fehlt" | "nicht_ueberwacht";

export async function getZahlungsuebersicht() {
  const [mietverhaeltnisse, bankkonten] = await Promise.all([
    prisma.mietverhaeltnis.findMany({
      where: { aktiv: true, auszugsdatum: null },
      include: {
        wohnung: { include: { objekt: true } },
        kontobewegungen: { orderBy: { datum: "desc" } },
      },
    }),
    prisma.bankkonto.findMany({ where: { status: "verbunden" } }),
  ]);

  mietverhaeltnisse.sort((a, b) => {
    const objektVergleich = a.wohnung.objekt.name.localeCompare(b.wohnung.objekt.name, "de");
    if (objektVergleich !== 0) return objektVergleich;
    return a.wohnung.lageImObjekt.localeCompare(b.wohnung.lageImObjekt, "de");
  });

  const heute = new Date();
  const monate = Array.from({ length: 3 }).map((_, i) => {
    const d = new Date(heute.getFullYear(), heute.getMonth() - (2 - i), 1);
    return { jahr: d.getFullYear(), monat: d.getMonth() };
  });

  const zeilen = mietverhaeltnisse.map((mv) => {
    const objektId = mv.wohnung.objektId;
    const ueberwacht = bankkonten.some((b) => b.objektId === null || b.objektId === objektId);
    const erwartet = warmmiete(
      mv.kaltmiete,
      mv.betriebskostenVorauszahlung,
      mv.heizkostenVorauszahlung
    );

    const monatsStatus = monate.map(({ jahr, monat }) => {
      const summe = mv.kontobewegungen
        .filter((k) => k.datum.getFullYear() === jahr && k.datum.getMonth() === monat)
        .reduce((s, k) => s + k.betrag, 0);

      let status: ZahlungsStatus;
      if (!ueberwacht) status = "nicht_ueberwacht";
      else if (summe >= erwartet - 2) status = "bezahlt";
      else if (summe > 0) status = "teilweise";
      else status = "fehlt";

      return { jahr, monat, summe, status };
    });

    return {
      mietverhaeltnis: mv,
      wohnung: mv.wohnung,
      objekt: mv.wohnung.objekt,
      erwartet,
      ueberwacht,
      monate: monatsStatus,
    };
  });

  return { zeilen, monate };
}

export async function getUnzugeordneteKontobewegungen() {
  return prisma.kontobewegung.findMany({
    where: { mietverhaeltnisId: null, betrag: { gt: 0 } },
    include: { bankkonto: true },
    orderBy: { datum: "desc" },
    take: 40,
  });
}

export async function getAktiveMietverhaeltnisListe() {
  const mietverhaeltnisse = await prisma.mietverhaeltnis.findMany({
    where: { aktiv: true, auszugsdatum: null },
    include: { wohnung: { include: { objekt: true } } },
  });

  return mietverhaeltnisse
    .map((mv) => ({
      id: mv.id,
      label: `${mv.wohnung.objekt.name} – ${mv.wohnung.bezeichnung} – ${mv.mieterName}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "de"));
}

// ---------- Textvorlagen ----------

const TEXTVORLAGE_KATEGORIEN = [
  "Mahnung",
  "Mieterhöhung",
  "Kündigungsbestätigung",
  "Nebenkostenabrechnung",
  "Wohnungsübergabe",
  "Willkommen/Einzug",
  "Sonstiges",
];

export async function getTextvorlagenGruppiert() {
  const vorlagen = await prisma.textvorlage.findMany({ orderBy: { titel: "asc" } });

  const kategorien = [
    ...TEXTVORLAGE_KATEGORIEN,
    ...Array.from(new Set(vorlagen.map((v) => v.kategorie))).filter(
      (k) => !TEXTVORLAGE_KATEGORIEN.includes(k)
    ),
  ];

  return kategorien
    .map((kategorie) => ({
      kategorie,
      vorlagen: vorlagen.filter((v) => v.kategorie === kategorie),
    }))
    .filter((gruppe) => gruppe.vorlagen.length > 0);
}
