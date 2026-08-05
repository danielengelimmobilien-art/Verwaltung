// Client für die GoCardless Bank Account Data API (PSD2-Kontoinformationsdienst,
// vormals Nordigen). Dokumentation: https://developer.gocardless.com/bank-account-data/overview
//
// Benötigt GOCARDLESS_SECRET_ID / GOCARDLESS_SECRET_KEY aus einem eigenen,
// kostenlosen Account auf https://bankaccountdata.gocardless.com – siehe README.
//
// Es wird bewusst kein npm-SDK verwendet, sondern direkt gegen die REST-API
// gesprochen (schlanker, keine zusätzliche Abhängigkeit, volle Kontrolle über
// Fehlerbehandlung). Ein frischer Access-Token wird pro Server-Action-Aufruf
// geholt statt über Server-Invocations hinweg zwischengespeichert, da
// serverless Function-Instanzen nicht zuverlässig persistent sind.

const BASE_URL = "https://bankaccountdata.gocardless.com/api/v2";

export class GoCardlessError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "GoCardlessError";
  }
}

export function istGoCardlessKonfiguriert() {
  return Boolean(
    process.env.GOCARDLESS_SECRET_ID && process.env.GOCARDLESS_SECRET_KEY
  );
}

export function pruefeGoCardlessKonfiguration() {
  if (!istGoCardlessKonfiguriert()) {
    throw new GoCardlessError(
      "GoCardless ist nicht konfiguriert. Bitte GOCARDLESS_SECRET_ID und GOCARDLESS_SECRET_KEY setzen (siehe README)."
    );
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string; query?: Record<string, string> } = {}
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail = data.detail || data.summary || JSON.stringify(data);
    } catch {
      detail = await res.text();
    }
    throw new GoCardlessError(
      `GoCardless-Anfrage fehlgeschlagen (${res.status}): ${detail || res.statusText}`,
      res.status
    );
  }

  return res.json() as Promise<T>;
}

export async function getAccessToken(): Promise<string> {
  pruefeGoCardlessKonfiguration();
  const data = await request<{ access: string }>("/token/new/", {
    method: "POST",
    body: {
      secret_id: process.env.GOCARDLESS_SECRET_ID,
      secret_key: process.env.GOCARDLESS_SECRET_KEY,
    },
  });
  return data.access;
}

export type Institution = {
  id: string;
  name: string;
  bic?: string;
  logo?: string;
};

export async function listInstitutions(
  token: string,
  country: string
): Promise<Institution[]> {
  return request<Institution[]>("/institutions/", {
    token,
    query: { country },
  });
}

export async function createAgreement(
  token: string,
  institutionId: string
): Promise<{ id: string }> {
  return request<{ id: string }>("/agreements/enduser/", {
    method: "POST",
    token,
    body: {
      institution_id: institutionId,
      max_historical_days: 180,
      access_valid_for_days: 90,
      access_scope: ["balances", "details", "transactions"],
    },
  });
}

export type Requisition = {
  id: string;
  status: string;
  link: string;
  accounts: string[];
};

export async function createRequisition(
  token: string,
  params: {
    institutionId: string;
    agreementId: string;
    redirectUrl: string;
    reference: string;
  }
): Promise<Requisition> {
  return request<Requisition>("/requisitions/", {
    method: "POST",
    token,
    body: {
      redirect: params.redirectUrl,
      institution_id: params.institutionId,
      agreement: params.agreementId,
      reference: params.reference,
      user_language: "DE",
    },
  });
}

export async function getRequisition(
  token: string,
  requisitionId: string
): Promise<Requisition> {
  return request<Requisition>(`/requisitions/${requisitionId}/`, { token });
}

export async function deleteRequisition(
  token: string,
  requisitionId: string
): Promise<void> {
  await request(`/requisitions/${requisitionId}/`, {
    method: "DELETE",
    token,
  });
}

export async function getAccountDetails(
  token: string,
  accountId: string
): Promise<{ account?: { iban?: string; ownerName?: string; name?: string; product?: string } }> {
  return request(`/accounts/${accountId}/details/`, { token });
}

export type GoCardlessTransaction = {
  transactionId?: string;
  internalTransactionId?: string;
  bookingDate?: string;
  valueDate?: string;
  transactionAmount?: { amount?: string; currency?: string };
  remittanceInformationUnstructured?: string;
  remittanceInformationUnstructuredArray?: string[];
  debtorName?: string;
  creditorName?: string;
};

export async function getAccountTransactions(
  token: string,
  accountId: string,
  dateFrom?: string
): Promise<{ booked: GoCardlessTransaction[]; pending: GoCardlessTransaction[] }> {
  const data = await request<{
    transactions: { booked: GoCardlessTransaction[]; pending: GoCardlessTransaction[] };
  }>(`/accounts/${accountId}/transactions/`, {
    token,
    query: dateFrom ? { date_from: dateFrom } : undefined,
  });
  return data.transactions;
}
