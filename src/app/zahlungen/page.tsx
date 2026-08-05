import {
  getBankkonten,
  getZahlungsuebersicht,
  getUnzugeordneteKontobewegungen,
  getAktiveMietverhaeltnisListe,
  getObjektListe,
} from "@/lib/queries";
import { bankkontoTrennen, zahlungZuordnen } from "@/lib/bank-actions";
import { istGoCardlessKonfiguriert } from "@/lib/gocardless";
import { formatEuro, formatDatum, formatMonat, maskeIban } from "@/lib/calc";
import { KontoStatusBadge, ZahlungsBadge } from "@/components/ui/badge";
import { BankIcon } from "@/components/ui/icons";
import { DeleteButton } from "@/components/ui/delete-button";
import { NewBankkontoButton } from "@/components/forms/bankkonto-form";
import { SyncButton } from "@/components/forms/bankkonto-sync-button";

export default async function ZahlungenPage() {
  const konfiguriert = istGoCardlessKonfiguriert();
  const [bankkonten, uebersicht, unzugeordnete, mietverhaeltnisListe, objekte] = await Promise.all([
    getBankkonten(),
    getZahlungsuebersicht(),
    getUnzugeordneteKontobewegungen(),
    getAktiveMietverhaeltnisListe(),
    getObjektListe(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Mietzahlungen prüfen</h1>
        <p className="text-[var(--muted)] text-sm mt-1">
          Bankkonten verbinden und eingehende Zahlungen automatisch mit den erwarteten
          Mietzahlungen abgleichen
        </p>
      </div>

      {!konfiguriert && (
        <div className="card p-4 text-sm bg-[var(--warn-soft)] border-transparent text-[var(--warn)]">
          GoCardless ist noch nicht konfiguriert. Setze <code>GOCARDLESS_SECRET_ID</code> und{" "}
          <code>GOCARDLESS_SECRET_KEY</code> (kostenloser Account auf{" "}
          <span className="font-medium">bankaccountdata.gocardless.com</span>), um Bankkonten
          verbinden zu können – siehe README.
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Verbundene Bankkonten</h2>
          {konfiguriert && <NewBankkontoButton objekte={objekte} />}
        </div>

        {bankkonten.length === 0 ? (
          <div className="card p-8 text-center text-sm text-[var(--muted)]">
            Noch kein Bankkonto verbunden.
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
                        {b.institutionName ?? "—"} · {maskeIban(b.iban)}
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
                  Letzter Sync: {b.letzterSync ? formatDatum(b.letzterSync) : "noch nie"}
                </div>
                <div className="flex items-center justify-between mt-1 pt-2 border-t border-[var(--border)]">
                  <DeleteButton
                    action={bankkontoTrennen.bind(null, b.id)}
                    confirmText={`Verbindung zu "${b.bezeichnung}" trennen? Bereits geladene Buchungen bleiben erhalten.`}
                    label="Trennen"
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
        <h2 className="font-semibold text-lg">Nicht zugeordnete Zahlungseingänge</h2>
        {unzugeordnete.length === 0 ? (
          <div className="card p-6 text-sm text-[var(--muted)]">
            Alle eingegangenen Zahlungen sind zugeordnet.
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
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
                      <form action={zahlungZuordnen.bind(null, b.id)} className="flex items-center gap-2">
                        <select name="mietverhaeltnisId" required className="!py-1 text-xs max-w-[220px]">
                          <option value="">Mietverhältnis wählen…</option>
                          {mietverhaeltnisListe.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="text-xs font-medium text-[var(--brand)] hover:underline whitespace-nowrap"
                        >
                          Zuordnen
                        </button>
                      </form>
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

