import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { cookies } from "next/headers";
import "@/styles/globals.css";

import { isClerkConfigured } from "@/lib/clerk";
import { PwaRegister } from "@/components/pwa-register";
import { GlobalControls } from "@/components/global-controls";
import { Splash } from "@/components/splash";
import { I18nProvider } from "@/components/i18n";

export const metadata: Metadata = {
  title: { default: "Eternime — Tu legado vive para siempre", template: "%s · Eternime" },
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
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const NO_FLASH = `(function(){try{var m=document.cookie.match(/(?:^|; )eternime-theme=(dark|light)/);var t=m?m[1]:(localStorage.getItem('eternime-theme')||'dark');document.documentElement.dataset.theme=t;var lm=document.cookie.match(/(?:^|; )eternime-lang=(es|en)/);var l=lm?lm[1]:(localStorage.getItem('eternime-lang')||'es');document.documentElement.setAttribute('lang',l);}catch(e){}})();`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const lang = cookieStore.get("eternime-lang")?.value === "en" ? "en" : "es";
  const theme = cookieStore.get("eternime-theme")?.value === "light" ? "light" : "dark";

  const tree = (
    <html lang={lang} data-theme={theme} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
      </head>
      <body>
        <I18nProvider lang={lang}>
          <Splash />
          <PwaRegister />
          {children}
          <GlobalControls />
        </I18nProvider>
      </body>
    </html>
  );

  return isClerkConfigured() ? <ClerkProvider>{tree}</ClerkProvider> : tree;
}
