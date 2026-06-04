import type { Metadata } from "next";
import { FadeInOnScroll } from "@/components/motion";
import { GuiaClient } from "@/components/app/GuiaClient";

export const metadata: Metadata = { title: "Mi guía" };

export default function GuiaPage() {
  return (
    <div className="grid gap-6">
      <FadeInOnScroll>
        <h1 className="et-serif text-2xl text-[var(--et-text)]">Mi guía</h1>
        <p className="mt-1 text-sm text-[var(--et-text-muted)]">
          Tu inteligencia personal — aprende de tus recuerdos para acompañar a los tuyos.
        </p>
      </FadeInOnScroll>
      <GuiaClient />
    </div>
  );
}
