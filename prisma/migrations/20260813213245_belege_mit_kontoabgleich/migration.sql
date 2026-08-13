-- CreateTable
CREATE TABLE "Beleg" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "aussteller" TEXT NOT NULL,
    "rechnungsnummer" TEXT,
    "rechnungsdatum" DATETIME NOT NULL,
    "betrag" REAL NOT NULL,
    "beschreibung" TEXT,
    "objektId" TEXT,
    "bkKategorie" TEXT,
    "status" TEXT NOT NULL DEFAULT 'offen',
    "kontobewegungId" TEXT,
    "automatischZugeordnet" BOOLEAN NOT NULL DEFAULT false,
    "notizen" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Beleg_objektId_fkey" FOREIGN KEY ("objektId") REFERENCES "Objekt" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Beleg_kontobewegungId_fkey" FOREIGN KEY ("kontobewegungId") REFERENCES "Kontobewegung" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Beleg_kontobewegungId_key" ON "Beleg"("kontobewegungId");

-- CreateIndex
CREATE INDEX "Beleg_objektId_idx" ON "Beleg"("objektId");
