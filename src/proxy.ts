import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Einfacher Passwortschutz (HTTP Basic Auth) für die gehostete App, da
// Miet- und Finanzdaten hinterlegt sind. Zugangsdaten über ENV-Variablen
// APP_BASIC_AUTH_USER / APP_BASIC_AUTH_PASSWORD gesetzt.
export function proxy(request: NextRequest) {
  const expectedUser = process.env.APP_BASIC_AUTH_USER;
  const expectedPassword = process.env.APP_BASIC_AUTH_PASSWORD;

  // Ohne konfigurierte Zugangsdaten bleibt die App offen (z.B. rein lokale Entwicklung).
  if (!expectedUser || !expectedPassword) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Basic ")) {
    const decoded = atob(authHeader.slice("Basic ".length));
    const separatorIndex = decoded.indexOf(":");
    const user = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);

    if (user === expectedUser && password === expectedPassword) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Zugang erforderlich", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Immobilien Verwaltung"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
