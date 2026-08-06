"use server";

import { prisma } from "@/lib/prisma";

export type SuchTreffer = {
  typ: "objekt" | "wohnung" | "mieter" | "kontakt" | "sanierung" | "textvorlage" | "bankkonto";
  titel: string;
  untertitel: string;
  href: string;
};

export async function sucheGlobal(rohQuery: string): Promise<SuchTreffer[]> {
  const q = rohQuery.trim();
  if (q.length < 2) return [];

  const [objekte, wohnungen, mietverhaeltnisse, kontakte, sanierungen, textvorlagen, bankkonten] =
    await Promise.all([
      prisma.objekt.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { strasse: { contains: q } },
            { ort: { contains: q } },
          ],
        },
        take: 5,
      }),
      prisma.wohnung.findMany({
        where: {
          OR: [{ bezeichnung: { contains: q } }, { lageImObjekt: { contains: q } }],
        },
        include: { objekt: true },
        take: 5,
      }),
      prisma.mietverhaeltnis.findMany({
        where: { mieterName: { contains: q } },
        include: { wohnung: { include: { objekt: true } } },
        take: 5,
      }),
      prisma.kontakt.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { ansprechpartner: { contains: q } },
            { kategorie: { contains: q } },
          ],
        },
        include: { objekt: true },
        take: 5,
      }),
      prisma.sanierung.findMany({
        where: { OR: [{ titel: { contains: q } }, { kategorie: { contains: q } }] },
        include: { objekt: true },
        take: 5,
      }),
      prisma.textvorlage.findMany({
        where: { OR: [{ titel: { contains: q } }, { kategorie: { contains: q } }] },
        take: 5,
      }),
      prisma.bankkonto.findMany({
        where: {
          OR: [{ bezeichnung: { contains: q } }, { institutionName: { contains: q } }],
        },
        take: 5,
      }),
    ]);

  const treffer: SuchTreffer[] = [];

  for (const o of objekte) {
    treffer.push({
      typ: "objekt",
      titel: o.name,
      untertitel: `${o.strasse}, ${o.plz} ${o.ort}`,
      href: `/objekte/${o.id}`,
    });
  }
  for (const w of wohnungen) {
    treffer.push({
      typ: "wohnung",
      titel: `${w.bezeichnung} · ${w.lageImObjekt}`,
      untertitel: w.objekt.name,
      href: `/objekte/${w.objektId}`,
    });
  }
  for (const m of mietverhaeltnisse) {
    treffer.push({
      typ: "mieter",
      titel: m.mieterName,
      untertitel: `${m.wohnung.objekt.name} · ${m.wohnung.bezeichnung}`,
      href: `/objekte/${m.wohnung.objektId}`,
    });
  }
  for (const k of kontakte) {
    treffer.push({
      typ: "kontakt",
      titel: k.name,
      untertitel: k.objekt ? `${k.kategorie} · ${k.objekt.name}` : `${k.kategorie} · Portfolioweit`,
      href: "/kontakte",
    });
  }
  for (const s of sanierungen) {
    treffer.push({
      typ: "sanierung",
      titel: s.titel,
      untertitel: `${s.kategorie} · ${s.objekt.name}`,
      href: `/sanierung#${s.objektId}`,
    });
  }
  for (const t of textvorlagen) {
    treffer.push({
      typ: "textvorlage",
      titel: t.titel,
      untertitel: t.kategorie,
      href: "/textvorlagen",
    });
  }
  for (const b of bankkonten) {
    treffer.push({
      typ: "bankkonto",
      titel: b.bezeichnung,
      untertitel: b.institutionName ?? "Manuell / PDF-Import",
      href: "/zahlungen",
    });
  }

  return treffer;
}
