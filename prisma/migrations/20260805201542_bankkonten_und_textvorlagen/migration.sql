-- CreateTable
CREATE TABLE "Bankkonto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bezeichnung" TEXT NOT NULL,
    "institutionId" TEXT,
    "institutionName" TEXT,
    "iban" TEXT,
    "kontoinhaber" TEXT,
    "requisitionId" TEXT,
    "gocardlessAccountId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ausstehend',
    "fehler" TEXT,
    "letzterSync" DATETIME,
    "objektId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Bankkonto_objektId_fkey" FOREIGN KEY ("objektId") REFERENCES "Objekt" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Kontobewegung" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bankkontoId" TEXT NOT NULL,
    "externeId" TEXT NOT NULL,
    "datum" DATETIME NOT NULL,
    "betrag" REAL NOT NULL,
    "waehrung" TEXT NOT NULL DEFAULT 'EUR',
    "verwendungszweck" TEXT,
    "absender" TEXT,
    "mietverhaeltnisId" TEXT,
    "automatischZugeordnet" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Kontobewegung_bankkontoId_fkey" FOREIGN KEY ("bankkontoId") REFERENCES "Bankkonto" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Kontobewegung_mietverhaeltnisId_fkey" FOREIGN KEY ("mietverhaeltnisId") REFERENCES "Mietverhaeltnis" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Textvorlage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titel" TEXT NOT NULL,
    "kategorie" TEXT NOT NULL,
    "inhalt" TEXT NOT NULL,
    "notizen" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Bankkonto_objektId_idx" ON "Bankkonto"("objektId");

-- CreateIndex
CREATE INDEX "Kontobewegung_bankkontoId_idx" ON "Kontobewegung"("bankkontoId");

-- CreateIndex
CREATE INDEX "Kontobewegung_mietverhaeltnisId_idx" ON "Kontobewegung"("mietverhaeltnisId");

-- CreateIndex
CREATE UNIQUE INDEX "Kontobewegung_bankkontoId_externeId_key" ON "Kontobewegung"("bankkontoId", "externeId");

-- CreateIndex
CREATE INDEX "Textvorlage_kategorie_idx" ON "Textvorlage"("kategorie");
