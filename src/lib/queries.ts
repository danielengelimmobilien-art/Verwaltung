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
