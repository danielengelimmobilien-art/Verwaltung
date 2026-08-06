# Immobilien Verwaltung

Portfolio-Dashboard für Wohnungen und Mehrfamilienhäuser: Nettokaltmiete im
Überblick (gesamt und je Objekt), Miete/m² im Vergleich zur Zielmiete,
Cashflow vs. Bankrate, eine Mieterübersicht mit Kaution/Kalt-/Warmmiete und
letzter Mieterhöhung, eine Sanierungs-/Modernisierungsübersicht je Objekt,
Kontakte für Gewerke/Dienstleister, eine Bankanbindung zur automatischen
Prüfung von Mietzahlungen sowie eine Bibliothek für Textvorlagen. Alle Daten
sind direkt in der Oberfläche editierbar.

## Tech-Stack

- **Next.js** (App Router, Server Actions) + TypeScript + Tailwind CSS
- **Prisma ORM** mit SQLite/libSQL – lokal als Datei, produktiv über
  [Turso](https://turso.tech) (kostenloser Tarif reicht für diese
  Portfolio-Größe locker aus). Es wird **derselbe Adapter** (`@prisma/adapter-libsql`)
  lokal und produktiv verwendet – der Wechsel ist nur eine andere
  `DATABASE_URL`, kein Code- oder Schema-Unterschied.
- **Recharts** für die Diagramme
- **pdf-parse** (pdfjs-dist) für die Texterkennung beim PDF-Kontoauszug-Import

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
- **Kontakt**: Gewerke/Dienstleister (Elektrik, Hausverwaltung, ...),
  portfolioweit oder einem Objekt zugeordnet
- **Bankkonto / Kontobewegung**: verbundenes Bankkonto samt importierter
  Buchungen zur Mietzahlungsprüfung (siehe unten)
- **Textvorlage**: wiederverwendbare Textbausteine (Mahnung, Mieterhöhung, ...)

Alles wird über die Formulare in der Oberfläche gepflegt (Buttons "Bearbeiten",
"+ Neues Objekt", "Mieterhöhung erfassen" usw.) – kein direkter
Datenbankzugriff nötig.

## Mietzahlungen prüfen (Bankanbindung)

Auf der Seite **Zahlungen** lässt sich ein echtes Bankkonto verbinden, um
eingehende Mietzahlungen automatisch mit den erwarteten Beträgen
abzugleichen. Das läuft über [GoCardless Bank Account Data](https://bankaccountdata.gocardless.com)
(PSD2-Kontoinformationsdienst, ehem. Nordigen) – einen Drittanbieter, bei dem
du selbst einen (kostenlosen) Account brauchst:

1. Auf [bankaccountdata.gocardless.com](https://bankaccountdata.gocardless.com)
   registrieren
2. Unter "Developers" ein `secret_id`/`secret_key`-Paar erzeugen
3. In `.env` bzw. den Vercel-Umgebungsvariablen setzen:
   - `GOCARDLESS_SECRET_ID`
   - `GOCARDLESS_SECRET_KEY`
4. In der App auf **Zahlungen → + Bankkonto verbinden** klicken, Bank
   auswählen, danach bei der Bank autorisieren (typische PSD2-Anmeldung) –
   du landest automatisch wieder in der App

Nach der Verbindung gleicht "Jetzt synchronisieren" die letzten 180 Tage an
Kontobewegungen ab und ordnet sie – wo eindeutig anhand von Betrag und
Namen im Verwendungszweck möglich – automatisch dem passenden
Mietverhältnis zu. Uneindeutige Zahlungen tauchen unter "Nicht zugeordnete
Zahlungseingänge" auf und lassen sich manuell zuordnen. Die
Bank-Autorisierung ist bei den meisten Banken nur ca. 90 Tage gültig und
muss danach erneuert werden (einfach das Konto neu verbinden).

Ohne gesetzte `GOCARDLESS_SECRET_ID`/`GOCARDLESS_SECRET_KEY` funktioniert die
übrige App normal weiter – die Zahlungsseite zeigt dann nur einen Hinweis
und blendet "Bankkonto verbinden" aus.

**Kosten:** GoCardless Bank Account Data hat für kleines Volumen (wenige
End-Nutzer/Konten wie hier) einen kostenlosen Tarif.

### Alternative: Kontoauszug als PDF hochladen

Unabhängig von GoCardless lässt sich auf **Zahlungen → PDF-Kontoauszug
hochladen** monatlich ein Kontoauszug als PDF hochladen (z.B. Export aus dem
Online-Banking). Die Buchungen werden automatisch erkannt (Datum, Betrag,
Verwendungszweck), vor dem Speichern in einer Tabelle zur Kontrolle
angezeigt und lassen sich dort korrigieren, bevor sie übernommen werden.
Danach läuft dieselbe automatische Zuordnung wie bei der Live-Anbindung:

- **Eingehende Zahlungen** werden – wo per Betrag/Name eindeutig möglich –
  automatisch dem passenden Mietverhältnis zugeordnet
- **Ausgaben** (negative Beträge) werden, wenn das Konto bereits einem
  Objekt zugeordnet ist oder Objektname/Straße/Ort im Verwendungszweck
  erkennbar sind, automatisch einem Objekt zugeordnet und erscheinen unter
  "Betriebskosten-relevante Zahlungen je Objekt" – als Grundlage für die
  Betriebskostenabrechnung. Uneindeutige Buchungen landen unter "Nicht
  zugeordnete Buchungen" zur manuellen Zuordnung (Mietverhältnis **oder**
  Objekt + Betriebskosten-Kategorie).

Die Texterkennung ist heuristisch (Muster "Datum ... Text ... Betrag[+/-]")
und deckt die gängigsten deutschen Kontoauszug-Exporte ab, aber nicht
zwangsläufig jedes Bankformat – deshalb die Kontrollansicht vor dem
Speichern. Buchungen ohne erkennbares Vorzeichen werden zunächst als
eingehend (positiv) angenommen und lassen sich vor dem Import direkt in der
Tabelle korrigieren.

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
   - `GOCARDLESS_SECRET_ID` / `GOCARDLESS_SECRET_KEY` = optional, für die
     Bankanbindung (siehe unten)
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
