import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { getAcademySlug } from "@/lib/tenant";
import { getDb } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export const metadata: Metadata = {
  title: "TT Academias | Portal del estudiante",
  description: "Tu academia de tenis de mesa, clases y torneos en un solo lugar.",
  applicationName: "TT Academias",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#731328",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let color = "#0b50c8";
  try {
    const slug = await getAcademySlug();
    if (slug) {
      const [rows] = await getDb().query<({ primaryColor: string } & RowDataPacket)[]>("SELECT primary_color AS primaryColor FROM academies WHERE slug=? AND status='active' LIMIT 1", [slug]);
      if (rows[0]?.primaryColor) color = rows[0].primaryColor;
    }
  } catch { /* Keep neutral default while local environment has no database configured. */ }
  const theme = { "--brand": color, "--brand-bright": color, "--brand-hover": `color-mix(in srgb, ${color} 82%, #000)`, "--brand-soft": `color-mix(in srgb, ${color} 8%, #fff)`, "--brand-border": `color-mix(in srgb, ${color} 18%, #fff)` } as React.CSSProperties;
  return (
    <html lang="es">
      <body style={theme}>{children}</body>
    </html>
  );
}
