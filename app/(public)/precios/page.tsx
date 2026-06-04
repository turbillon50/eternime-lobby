import type { Metadata } from "next";
import { PreciosContent } from "@/components/public/precios-content";

export const metadata: Metadata = {
  title: "Precios | Eternime",
  description:
    "Planes Semilla (gratis), Legado ($199 MXN/mes) y Eterno ($2,999 MXN pago unico). Elige cómo preservar tu memoria para siempre.",
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
