-- CreateTable
CREATE TABLE "Objekt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "strasse" TEXT NOT NULL,
    "plz" TEXT NOT NULL,
    "ort" TEXT NOT NULL,
    "lage" TEXT,
    "baujahr" INTEGER,
    "kaufpreis" REAL,
    "kaufdatum" DATETIME,
    "darlehenssumme" REAL,
    "zinssatzProzent" REAL,
    "tilgungProzent" REAL,
    "bankrateMonatlich" REAL,
    "bankName" TEXT,
    "notizen" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Wohnung" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "objektId" TEXT NOT NULL,
    "bezeichnung" TEXT NOT NULL,
    "lageImObjekt" TEXT NOT NULL,
    "groesseQm" REAL NOT NULL,
    "zimmer" REAL,
    "zielmieteProQm" REAL,
    "notizen" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Wohnung_objektId_fkey" FOREIGN KEY ("objektId") REFERENCES "Objekt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mietverhaeltnis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wohnungId" TEXT NOT NULL,
    "mieterName" TEXT NOT NULL,
    "einzugsdatum" DATETIME NOT NULL,
    "auszugsdatum" DATETIME,
    "kaution" REAL,
    "kaltmiete" REAL NOT NULL,
    "betriebskostenVorauszahlung" REAL,
    "heizkostenVorauszahlung" REAL,
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "notizen" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Mietverhaeltnis_wohnungId_fkey" FOREIGN KEY ("wohnungId") REFERENCES "Wohnung" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mieterhoehung" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mietverhaeltnisId" TEXT NOT NULL,
    "datum" DATETIME NOT NULL,
    "alteKaltmiete" REAL NOT NULL,
    "neueKaltmiete" REAL NOT NULL,
    "grund" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Mieterhoehung_mietverhaeltnisId_fkey" FOREIGN KEY ("mietverhaeltnisId") REFERENCES "Mietverhaeltnis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sanierung" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "objektId" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "kategorie" TEXT NOT NULL,
    "datum" DATETIME NOT NULL,
    "beschreibung" TEXT,
    "kosten" REAL,
    "status" TEXT NOT NULL DEFAULT 'geplant',
    "belegHinweis" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sanierung_objektId_fkey" FOREIGN KEY ("objektId") REFERENCES "Objekt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Objekt_name_idx" ON "Objekt"("name");

-- CreateIndex
CREATE INDEX "Wohnung_objektId_idx" ON "Wohnung"("objektId");

-- CreateIndex
CREATE INDEX "Mietverhaeltnis_wohnungId_idx" ON "Mietverhaeltnis"("wohnungId");

-- CreateIndex
CREATE INDEX "Mieterhoehung_mietverhaeltnisId_idx" ON "Mieterhoehung"("mietverhaeltnisId");

-- CreateIndex
CREATE INDEX "Sanierung_objektId_idx" ON "Sanierung"("objektId");
