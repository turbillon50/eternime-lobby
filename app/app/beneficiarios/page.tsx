import type { Metadata } from "next";
import { FadeInOnScroll } from "@/components/motion";
import { BeneficiariosClient } from "@/components/app/BeneficiariosClient";

export const metadata: Metadata = { title: "Beneficiarios" };

export default function BeneficiariosPage() {
  return (
    <div className="grid gap-6">
      <FadeInOnScroll>
        <h1 className="et-serif text-2xl text-[var(--et-text)]">Beneficiarios</h1>
        <p className="mt-1 text-sm text-[var(--et-text-muted)]">Las personas que recibirán tu legado.</p>
      </FadeInOnScroll>
      <BeneficiariosClient />
    </div>
  );
}
