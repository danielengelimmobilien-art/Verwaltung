import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "Immobilien Verwaltung",
  description: "Portfolio-Übersicht für Mieten, Objekte und Sanierungen",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Nav />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </main>
        <footer className="text-center text-xs py-6 text-[var(--muted)]">
          Immobilien Verwaltung · private Nutzung
        </footer>
      </body>
    </html>
  );
}
