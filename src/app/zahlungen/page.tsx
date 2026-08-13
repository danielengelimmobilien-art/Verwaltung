import {
  getBankkonten,
  getZahlungsuebersicht,
  getUnzugeordneteKontobewegungen,
  getAktiveMietverhaeltnisListe,
  getObjektListe,
  getBetriebskostenZahlungen,
  getBelege,
  getUnverknuepfteKontobewegungen,
} from "@/lib/queries";
import { bankkontoTrennen } from "@/lib/bank-actions";
import { istGoCardlessKonfiguriert } from "@/lib/gocardless";
import { formatEuro, formatDatum, formatMonat, maskeIban } from "@/lib/calc";
import { KontoStatusBadge, ZahlungsBadge, Badge } from "@/components/ui/badge";
import { BankIcon } from "@/components/ui/icons";
import { DeleteButton } from "@/components/ui/delete-button";
import { NewBankkontoButton } from "@/components/forms/bankkonto-form";
import { SyncButton } from "@/components/forms/bankkonto-sync-button";
import { PdfImportButton } from "@/components/forms/pdf-import-form";
import { ZuordnenForm } from "@/components/forms/zuordnen-form";
import { NewBelegButton } from "@/components/forms/beleg-form";
import { BelegTable } from "@/components/beleg-table";

export default async function ZahlungenPage() {
  const konfiguriert = istGoCardlessKonfiguriert();
  const [
    bankkonten,
    uebersicht,
    unzugeordnete,
    mietverhaeltnisListe,
    objekte,
    betriebskosten,
    belege,
    unverknuepfteKontobewegungen,
  ] = await Promise.all([
    getBankkonten(),
    getZahlungsuebersicht(),
    getUnzugeordneteKontobewegungen(),
    getAktiveMietverhaeltnisListe(),
    getObjektListe(),
    getBetriebskostenZahlungen(),
    getBelege(),
    getUnverknuepfteKontobewegungen(),
  ]);
  const offeneBelege = belege.filter((b) => b.status === "offen").length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Zahlungen prüfen</h1>
        <p className="text-[var(--muted)] text-sm mt-1">
          Bankkonten verbinden oder Kontoauszüge als PDF hochladen – Mietzahlungen und sonstige
          Zahlungen werden automatisch zugeordnet
        </p>
      </div>

      {!konfiguriert && (
        <div className="card p-4 text-sm bg-[var(--warn-soft)] border-transparent text-[var(--warn)]">
          GoCardless ist noch nicht konfiguriert. Setze <code>GOCARDLESS_SECRET_ID</code> und{" "}
          <code>GOCARDLESS_SECRET_KEY</code> (kostenloser Account auf{" "}
          <span className="font-medium">bankaccountdata.gocardless.com</span>), um Bankkonten live
          zu verbinden – siehe README. Der PDF-Kontoauszug-Import funktioniert unabhängig davon
          bereits jetzt.
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-lg">Bankkonten</h2>
          <div className="flex items-center gap-2">
            <PdfImportButton
              bankkonten={bankkonten.map((b) => ({ id: b.id, bezeichnung: b.bezeichnung }))}
              objekte={objekte}
            />
            {konfiguriert && <NewBankkontoButton objekte={objekte} />}
          </div>
        </div>

        {bankkonten.length === 0 ? (
          <div className="card p-8 text-center text-sm text-[var(--muted)]">
            Noch kein Bankkonto verbunden oder angelegt.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankkonten.map((b) => (
              <div key={b.id} className="card p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                      <BankIcon className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="font-semibold">{b.bezeichnung}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {b.institutionName ?? (b.quelle === "manuell" ? "Manuell / PDF-Import" : "—")}{" "}
                        · {maskeIban(b.iban)}
                      </div>
                    </div>
                  </div>
                  <KontoStatusBadge status={b.status} />
                </div>
                <div className="text-xs text-[var(--muted)]">
                  {b.objekt ? b.objekt.name : "Portfolioweit"}
                </div>
                {b.fehler && <p className="text-xs text-[var(--bad)]">{b.fehler}</p>}
                <div className="text-xs text-[var(--muted)]">
                  Letzte Aktualisierung: {b.letzterSync ? formatDatum(b.letzterSync) : "noch nie"}
                </div>
                <div className="flex items-center justify-between mt-1 pt-2 border-t border-[var(--border)]">
                  <DeleteButton
                    action={bankkontoTrennen.bind(null, b.id)}
                    confirmText={`"${b.bezeichnung}" wirklich entfernen? Bereits geladene Buchungen bleiben erhalten.`}
                    label="Entfernen"
                  />
                  {b.status === "verbunden" && <SyncButton bankkontoId={b.id} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="font-semibold text-lg">Zahlungsstatus je Mietverhältnis</h2>
        {uebersicht.zeilen.length === 0 ? (
          <div className="card p-8 text-center text-sm text-[var(--muted)]">
            Keine aktiven Mietverhältnisse vorhanden.
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
                  <th className="px-4 py-3 font-semibold">Mieter</th>
                  <th className="px-4 py-3 font-semibold">Objekt / Wohnung</th>
                  <th className="px-4 py-3 font-semibold">Erwartet</th>
                  {uebersicht.monate.map((m) => (
                    <th key={`${m.jahr}-${m.monat}`} className="px-4 py-3 font-semibold">
                      {formatMonat(m.jahr, m.monat)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uebersicht.zeilen.map((zeile) => (
                  <tr
                    key={zeile.mietverhaeltnis.id}
                    className="border-b border-[var(--border)] last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">{zeile.mietverhaeltnis.mieterName}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {zeile.objekt.name} · {zeile.wohnung.bezeichnung}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{formatEuro(zeile.erwartet)}</td>
                    {zeile.monate.map((m) => (
                      <td key={`${m.jahr}-${m.monat}`} className="px-4 py-3">
                        <ZahlungsBadge status={m.status} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-lg">Belege &amp; Rechnungen</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Rechnungen als PDF hochladen – Betrag/Datum werden vorgeschlagen und automatisch
              mit den Kontobewegungen abgeglichen{offeneBelege > 0 && ` · ${offeneBelege} offen`}
            </p>
          </div>
          <NewBelegButton objekte={objekte} />
        </div>
        <BelegTable
          belege={belege}
          objekte={objekte}
          unverknuepfteKontobewegungen={unverknuepfteKontobewegungen}
        />
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-semibold text-lg">Betriebskosten-relevante Zahlungen je Objekt</h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Ausgaben, die einem Objekt zugeordnet wurden – als Grundlage für die
            Betriebskostenabrechnung
          </p>
        </div>
        {betriebskosten.length === 0 ? (
          <div className="card p-6 text-sm text-[var(--muted)]">
            Noch keine Zahlungen einem Objekt zugeordnet.
          </div>
        ) : (
          betriebskosten.map(({ objekt, bewegungen, summe }) => (
            <div key={objekt.id} className="card overflow-x-auto">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <span className="font-semibold text-sm">{objekt.name}</span>
                <span className="text-sm font-semibold tabular-nums">{formatEuro(summe)}</span>
              </div>
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
                    <th className="px-4 py-2 font-semibold">Datum</th>
                    <th className="px-4 py-2 font-semibold">Kategorie</th>
                    <th className="px-4 py-2 font-semibold">Verwendungszweck</th>
                    <th className="px-4 py-2 font-semibold text-right">Betrag</th>
                  </tr>
                </thead>
                <tbody>
                  {bewegungen.map((b) => (
                    <tr key={b.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-4 py-2 whitespace-nowrap tabular-nums">
                        {formatDatum(b.datum)}
                      </td>
                      <td className="px-4 py-2">
                        <Badge tone="brand">{b.bkKategorie ?? "Sonstiges"}</Badge>
                      </td>
                      <td className="px-4 py-2 text-[var(--muted)] max-w-sm truncate">
                        {b.verwendungszweck ?? "–"}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">{formatEuro(b.betrag)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="font-semibold text-lg">Nicht zugeordnete Buchungen</h2>
        {unzugeordnete.length === 0 ? (
          <div className="card p-6 text-sm text-[var(--muted)]">
            Alle Buchungen sind zugeordnet.
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
                  <th className="px-4 py-3 font-semibold">Datum</th>
                  <th className="px-4 py-3 font-semibold">Absender</th>
                  <th className="px-4 py-3 font-semibold">Verwendungszweck</th>
                  <th className="px-4 py-3 font-semibold">Betrag</th>
                  <th className="px-4 py-3 font-semibold">Zuordnen</th>
                </tr>
              </thead>
              <tbody>
                {unzugeordnete.map((b) => (
                  <tr key={b.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                      {formatDatum(b.datum)}
                    </td>
                    <td className="px-4 py-3">{b.absender ?? "–"}</td>
                    <td className="px-4 py-3 text-[var(--muted)] max-w-xs truncate">
                      {b.verwendungszweck ?? "–"}
                    </td>
                    <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                      {formatEuro(b.betrag)}
                    </td>
                    <td className="px-4 py-3">
                      <ZuordnenForm
                        kontobewegungId={b.id}
                        mietverhaeltnisse={mietverhaeltnisListe}
                        objekte={objekte}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
