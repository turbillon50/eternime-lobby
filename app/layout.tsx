import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "@/styles/globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-eternime", display: "swap" });

import { isClerkConfigured } from "@/lib/clerk";
import { PwaRegister } from "@/components/pwa-register";
import { Splash } from "@/components/splash";
import { AuroraBackground } from "@/components/aurora-background";
import { I18nProvider } from "@/components/i18n";

export const metadata: Metadata = {
  title: { default: "Eternime — Tu segunda memoria", template: "%s · Eternime" },
  description:
    "Tu segunda memoria asistida por Eon. Guarda recuerdos, decisiones, documentos, voz e historia para hoy, mañana y siempre.",
  applicationName: "Eternime",
  manifest: "/manifest.json",
  keywords: ["legado digital", "memoria", "cartas de legado", "recuerdos", "Eternime"],
  openGraph: {
    title: "Eternime — Tu segunda memoria",
    description: "Tu segunda memoria asistida por Eon. Recuerda contigo, crece contigo y permanece contigo.",
    locale: "es_MX",
    siteName: "Eternime",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/images/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
};

export const viewport: Viewport = {
  // Negro OLED absoluto: decisión explícita de marca para Eternime.
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Eternime vive solo en modo oscuro (identidad de marca: obsidian + halo).
  // El toggle de tema/idioma se quito por decision directa de Luis — el modo
  // claro rompia el contraste del hero (texto blanco pensado para fondo
  // oscuro, ilegible sobre el fondo claro) y el idioma nunca estuvo traducido
  // de verdad mas alla del header. Mas simple y mas solido: un solo tema,
  // un solo idioma, bien hechos, en vez de un toggle a medias.
  const lang = "es";

  const tree = (
    <html lang={lang} data-theme="dark" className={manrope.variable} suppressHydrationWarning>
      <body>
        <I18nProvider lang={lang}>
          <AuroraBackground />
          <Splash />
          <PwaRegister />
          {children}
        </I18nProvider>
      </body>
    </html>
  );

  return isClerkConfigured() ? <ClerkProvider>{tree}</ClerkProvider> : tree;
}
