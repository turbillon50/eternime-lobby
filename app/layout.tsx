import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";

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
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
