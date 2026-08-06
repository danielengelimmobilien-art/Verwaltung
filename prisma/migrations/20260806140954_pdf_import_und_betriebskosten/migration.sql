-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bankkonto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bezeichnung" TEXT NOT NULL,
    "institutionId" TEXT,
    "institutionName" TEXT,
    "iban" TEXT,
    "kontoinhaber" TEXT,
    "requisitionId" TEXT,
    "gocardlessAccountId" TEXT,
    "quelle" TEXT NOT NULL DEFAULT 'gocardless',
    "status" TEXT NOT NULL DEFAULT 'ausstehend',
    "fehler" TEXT,
    "letzterSync" DATETIME,
    "objektId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Bankkonto_objektId_fkey" FOREIGN KEY ("objektId") REFERENCES "Objekt" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Bankkonto" ("bezeichnung", "createdAt", "fehler", "gocardlessAccountId", "iban", "id", "institutionId", "institutionName", "kontoinhaber", "letzterSync", "objektId", "requisitionId", "status", "updatedAt") SELECT "bezeichnung", "createdAt", "fehler", "gocardlessAccountId", "iban", "id", "institutionId", "institutionName", "kontoinhaber", "letzterSync", "objektId", "requisitionId", "status", "updatedAt" FROM "Bankkonto";
DROP TABLE "Bankkonto";
ALTER TABLE "new_Bankkonto" RENAME TO "Bankkonto";
CREATE INDEX "Bankkonto_objektId_idx" ON "Bankkonto"("objektId");
CREATE TABLE "new_Kontobewegung" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bankkontoId" TEXT NOT NULL,
    "externeId" TEXT NOT NULL,
    "quelle" TEXT NOT NULL DEFAULT 'gocardless',
    "datum" DATETIME NOT NULL,
    "betrag" REAL NOT NULL,
    "waehrung" TEXT NOT NULL DEFAULT 'EUR',
    "verwendungszweck" TEXT,
    "absender" TEXT,
    "mietverhaeltnisId" TEXT,
    "objektId" TEXT,
    "bkKategorie" TEXT,
    "automatischZugeordnet" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Kontobewegung_bankkontoId_fkey" FOREIGN KEY ("bankkontoId") REFERENCES "Bankkonto" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Kontobewegung_mietverhaeltnisId_fkey" FOREIGN KEY ("mietverhaeltnisId") REFERENCES "Mietverhaeltnis" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Kontobewegung_objektId_fkey" FOREIGN KEY ("objektId") REFERENCES "Objekt" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Kontobewegung" ("absender", "automatischZugeordnet", "bankkontoId", "betrag", "createdAt", "datum", "externeId", "id", "mietverhaeltnisId", "verwendungszweck", "waehrung") SELECT "absender", "automatischZugeordnet", "bankkontoId", "betrag", "createdAt", "datum", "externeId", "id", "mietverhaeltnisId", "verwendungszweck", "waehrung" FROM "Kontobewegung";
DROP TABLE "Kontobewegung";
ALTER TABLE "new_Kontobewegung" RENAME TO "Kontobewegung";
CREATE INDEX "Kontobewegung_bankkontoId_idx" ON "Kontobewegung"("bankkontoId");
CREATE INDEX "Kontobewegung_mietverhaeltnisId_idx" ON "Kontobewegung"("mietverhaeltnisId");
CREATE INDEX "Kontobewegung_objektId_idx" ON "Kontobewegung"("objektId");
CREATE UNIQUE INDEX "Kontobewegung_bankkontoId_externeId_key" ON "Kontobewegung"("bankkontoId", "externeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
