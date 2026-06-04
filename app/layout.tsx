import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "@/styles/globals.css";

import { isClerkConfigured } from "@/lib/clerk";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: {
    default: "Eternime — Tu legado vive para siempre",
    template: "%s · Eternime",
  },
  description:
    "Digital Legacy Intelligence. Preserva tus recuerdos, cartas de legado y tu guía personal de IA para quienes amas.",
  applicationName: "Eternime",
  manifest: "/manifest.json",
  keywords: ["legado digital", "memoria", "cartas de legado", "recuerdos", "Eternime"],
  openGraph: {
    title: "Eternime — Tu legado vive para siempre",
    description: "Preserva tu memoria para tus seres queridos. Digital Legacy Intelligence.",
    locale: "es_MX",
    siteName: "Eternime",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/images/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tree = (
    <html lang="es">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );

  // Only mount ClerkProvider when keys exist, so the lobby still renders in
  // demo mode (no keys) without a runtime Clerk error.
  return isClerkConfigured() ? <ClerkProvider>{tree}</ClerkProvider> : tree;
}
