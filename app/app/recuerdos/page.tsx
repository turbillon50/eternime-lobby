import type { Metadata } from "next";
import { FadeInOnScroll } from "@/components/motion";
import { RecuerdosClient } from "@/components/app/RecuerdosClient";

export const metadata: Metadata = { title: "Mis recuerdos" };

export default function RecuerdosPage() {
  return (
    <div className="grid gap-6">
      <FadeInOnScroll>
        <h1 className="et-serif text-2xl text-[var(--et-text)]">Mis recuerdos</h1>
        <p className="mt-1 text-sm text-[var(--et-text-muted)]">Los momentos que definen quién eres.</p>
      </FadeInOnScroll>
      <RecuerdosClient />
    </div>
  );
}
