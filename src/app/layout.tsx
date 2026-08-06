import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "Immobilien Verwaltung",
  description: "Portfolio-Übersicht für Mieten, Objekte und Sanierungen",
};

const themeInitScript = `
(function() {
  try {
    var gespeichert = localStorage.getItem('theme');
    if (gespeichert === 'dark' || gespeichert === 'light') {
      document.documentElement.setAttribute('data-theme', gespeichert);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
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
