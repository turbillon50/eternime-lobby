import type { Metadata } from "next";
import { PreciosContent } from "@/components/public/precios-content";

export const metadata: Metadata = {
  title: "Precios | Eternime",
  description:
    "Plan Semilla gratis y Legado por US$10 al mes. Tu segunda memoria, sin limites. Eterno, muy pronto.",
  openGraph: {
    title: "Precios de Eternime",
    description: "Desde gratis hasta para siempre. Tu legado, a tu medida.",
    locale: "es_MX",
    type: "website",
  },
};

export default function PreciosPage() {
  return <PreciosContent />;
}
