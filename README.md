# Immobilien Verwaltung

Portfolio-Dashboard für Wohnungen und Mehrfamilienhäuser: Nettokaltmiete im
Überblick (gesamt und je Objekt), Miete/m² im Vergleich zur Zielmiete,
Cashflow vs. Bankrate, eine Mieterübersicht mit Kaution/Kalt-/Warmmiete und
letzter Mieterhöhung, sowie eine Sanierungs-/Modernisierungsübersicht je
Objekt. Alle Daten sind direkt in der Oberfläche editierbar.

## Tech-Stack

- **Next.js** (App Router, Server Actions) + TypeScript + Tailwind CSS
- **Prisma ORM** mit SQLite/libSQL – lokal als Datei, produktiv über
  [Turso](https://turso.tech) (kostenloser Tarif reicht für diese
  Portfolio-Größe locker aus). Es wird **derselbe Adapter** (`@prisma/adapter-libsql`)
  lokal und produktiv verwendet – der Wechsel ist nur eine andere
  `DATABASE_URL`, kein Code- oder Schema-Unterschied.
- **Recharts** für die Diagramme

## Lokal starten

```bash
npm install
npx prisma migrate dev   # legt prisma/dev.db an (bereits geschehen, falls dev.db existiert)
npx prisma db seed       # optional: Beispieldaten einspielen
npm run dev
```

Die App läuft dann unter `http://localhost:3000`.

Kopiere `.env.example` nach `.env` und passe bei Bedarf an. Standardmäßig ist
für die lokale Entwicklung ein Basis-Passwortschutz mit Beispiel-Zugangsdaten
hinterlegt (`admin` / `bitte-aendern` in `.env.example`) – **vor dem
Deployment unbedingt ändern** (siehe unten).

## Datenmodell (Kurzüberblick)

- **Objekt**: eine Immobilie (einzelne ETW oder Mehrfamilienhaus) mit Adresse,
  Lage, Baujahr, Finanzierung (Darlehen, Zins, Tilgung, monatliche Bankrate)
- **Wohnung**: eine Einheit innerhalb eines Objekts, mit Lage im Objekt (z.B.
  "2. OG rechts"), Größe, Zielmiete/m²
- **Mietverhältnis**: aktueller/historischer Mieter einer Wohnung mit
  Einzugsdatum, Kaution, Kaltmiete, Betriebs-/Heizkostenvorauszahlung
- **Mieterhöhung**: Historie der Mieterhöhungen zu einem Mietverhältnis
- **Sanierung**: Modernisierungs-/Sanierungsmaßnahme je Objekt (Kategorie,
  Kosten, Status, optionaler Ablage-Hinweis)

Alles wird über die Formulare in der Oberfläche gepflegt (Buttons "Bearbeiten",
"+ Neues Objekt", "Mieterhöhung erfassen" usw.) – kein direkter
Datenbankzugriff nötig.

## Sanierungs-/Modernisierungsunterlagen aus lokalen Ordnern

Diese App-Version läuft in einer Cloud-Sitzung ohne Zugriff auf deinen
Laptop, daher werden Sanierungsmaßnahmen manuell über das Formular erfasst
(inkl. optionalem Ablage-Hinweis, z.B. "Ordner 'MFH Lindenstraße/Sanierung
2024'"). Wenn du **Claude Code lokal** auf deinem Rechner installierst und
gegen dieses Repository laufen lässt, kann eine automatische Auswertung
deiner Beleg-/Dokumentenordner ergänzt werden (Claude liest dann die Ordner
direkt und legt passende Sanierungs-Einträge an).

## Deployment (kostenlos, von jedem Gerät erreichbar)

### 1. Datenbank bei Turso anlegen (kostenlos)

1. Auf [turso.tech](https://turso.tech) registrieren
2. Neue Datenbank anlegen (z.B. `immobilien-verwaltung`)
3. Connection-URL (`libsql://...turso.io`) und Auth-Token erzeugen/kopieren

### 2. Schema auf die Turso-Datenbank anwenden

```bash
DATABASE_URL="libsql://<deine-db>.turso.io" TURSO_AUTH_TOKEN="<dein-token>" npx prisma migrate deploy
DATABASE_URL="libsql://<deine-db>.turso.io" TURSO_AUTH_TOKEN="<dein-token>" npx prisma db seed   # optional
```

### 3. Auf Vercel deployen

1. Auf [vercel.com](https://vercel.com) mit GitHub-Account registrieren
2. Dieses Repository importieren ("New Project")
3. Folgende Umgebungsvariablen in den Vercel-Projekteinstellungen setzen:
   - `DATABASE_URL` = `libsql://<deine-db>.turso.io`
   - `TURSO_AUTH_TOKEN` = `<dein-token>`
   - `APP_BASIC_AUTH_USER` = eigener Benutzername
   - `APP_BASIC_AUTH_PASSWORD` = eigenes, sicheres Passwort
4. Deploy klicken

Die App ist danach unter der von Vercel vergebenen URL erreichbar (auf
Wunsch mit eigener Domain verknüpfbar) – geschützt durch das gesetzte
Basis-Passwort. Login-Daten kannst du z.B. mit deiner Frau teilen, damit sie
ebenfalls Zugriff hat.

### Laufende Kosten

Bei diesem Datenumfang (bis ~10 Objekte, ~50 Wohnungen) bewegt sich alles im
kostenlosen Kontingent von Vercel und Turso – realistisch 0 €/Monat.

## Daten ändern

Alle Stammdaten (Objekte, Wohnungen, Mietverhältnisse, Mieterhöhungen,
Sanierungen) lassen sich direkt in der Oberfläche über die jeweiligen
"Bearbeiten"/"+"-Buttons anpassen – ohne Codeänderung.
