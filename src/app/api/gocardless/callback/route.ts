import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { finalisiereBankverbindung } from "@/lib/bank-actions";

// Rücksprung-Ziel nach der Bank-Autorisierung bei GoCardless Bank Account Data.
// Kein Webhook, sondern ein normaler Browser-Redirect der Bank zurück in die App.
export async function GET(request: NextRequest) {
  const bankkontoId = request.nextUrl.searchParams.get("req");

  if (bankkontoId) {
    await finalisiereBankverbindung(bankkontoId).catch(() => {});
  }

  return NextResponse.redirect(new URL("/zahlungen", request.url));
}
