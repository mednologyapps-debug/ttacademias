import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";

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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
