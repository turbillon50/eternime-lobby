import type { Metadata } from "next";
import { FadeInOnScroll } from "@/components/motion";
import { GuiaClient } from "@/components/app/GuiaClient";

export const metadata: Metadata = { title: "Eon" };

export default function GuiaPage() {
  return (
    <div className="grid gap-6">
      <FadeInOnScroll>
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="et-glow-ring flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(212,175,106,0.45)]"
            style={{ boxShadow: "0 0 18px rgba(212,175,106,0.3), inset 0 0 12px rgba(212,175,106,0.15)" }}
          >
            <span className="et-serif text-[0.55rem] tracking-[0.25em] text-[var(--et-gold-bright)]">EON</span>
          </span>
          <div>
            <h1 className="et-serif text-2xl text-[var(--et-text)]">Eon</h1>
            <p className="text-sm text-[var(--et-text-muted)]">
              La inteligencia central de Eternime — construye tu IA personal a partir de tus recuerdos.
            </p>
          </div>
        </div>
      </FadeInOnScroll>
      <GuiaClient />
    </div>
  );
}
