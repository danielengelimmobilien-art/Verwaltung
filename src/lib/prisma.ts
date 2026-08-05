import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// Ein Adapter für lokale Datei (Entwicklung) und Turso/libSQL-Remote (Produktion).
// Wechsel zwischen beiden erfolgt ausschließlich über DATABASE_URL / TURSO_AUTH_TOKEN,
// ohne Code- oder Schema-Änderung.
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
