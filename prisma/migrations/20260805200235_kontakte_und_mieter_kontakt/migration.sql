-- AlterTable
ALTER TABLE "Mietverhaeltnis" ADD COLUMN "email" TEXT;
ALTER TABLE "Mietverhaeltnis" ADD COLUMN "telefon" TEXT;

-- CreateTable
CREATE TABLE "Kontakt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kategorie" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ansprechpartner" TEXT,
    "telefon" TEXT,
    "email" TEXT,
    "adresse" TEXT,
    "notizen" TEXT,
    "objektId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Kontakt_objektId_fkey" FOREIGN KEY ("objektId") REFERENCES "Objekt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Kontakt_objektId_idx" ON "Kontakt"("objektId");

-- CreateIndex
CREATE INDEX "Kontakt_kategorie_idx" ON "Kontakt"("kategorie");
