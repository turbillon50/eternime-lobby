import type { Metadata } from "next";
import { FadeInOnScroll } from "@/components/motion";
import { BeneficiariosClient } from "@/components/app/BeneficiariosClient";

export const metadata: Metadata = { title: "Herederos" };

export default function HerederosPage() {
  return (
    <div className="grid gap-6">
      <FadeInOnScroll>
        <h1 className="et-serif text-2xl text-[var(--et-text)]">Herederos</h1>
        <p className="mt-1 text-sm text-[var(--et-text-muted)]">Quiénes reciben tu legado, qué recuerdos y cuándo.</p>
      </FadeInOnScroll>
      <BeneficiariosClient />
    </div>
  );
}
