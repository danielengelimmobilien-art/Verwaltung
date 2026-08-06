import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse/pdfjs-dist laden zur Laufzeit ihre Worker-Datei vom Dateisystem -
  // das funktioniert nur mit nativem Node-`require`, nicht wenn Next.js den
  // Code in Server Actions/Route Handlers bündelt.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
