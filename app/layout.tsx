import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "@/styles/globals.css";

import { isClerkConfigured } from "@/lib/clerk";

export const metadata: Metadata = {
  title: "Eternime | Digital Legacy Intelligence",
  description: "A cinematic onboarding lobby for preserving a digital legacy.",
  applicationName: "Eternime",
  manifest: "/manifest.json",
  icons: {
    icon: "/images/icon.svg",
    apple: "/images/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
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
    <html lang="en">
      <body>{children}</body>
    </html>
  );

  // Only mount ClerkProvider when keys exist, so the lobby still renders in
  // demo mode (no keys) without a runtime Clerk error.
  return isClerkConfigured() ? <ClerkProvider>{tree}</ClerkProvider> : tree;
}
