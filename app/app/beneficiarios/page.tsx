import type { Metadata } from "next";
import { FadeInOnScroll } from "@/components/motion";
import { BeneficiariosClient } from "@/components/app/BeneficiariosClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Personas" };

export default function HerederosPage() {
  return (
    <div className="grid gap-6">
      <FadeInOnScroll>
        <p className="eon-screen-kicker">Personas</p><h1 className="eon-screen-title">Tu red empieza por quienes importan.</h1>
        <p className="eon-screen-sub">Relaciones, contexto y conexiones que Eon aprende contigo.</p>
      </FadeInOnScroll>
      <BeneficiariosClient />
    </div>
  );
}
