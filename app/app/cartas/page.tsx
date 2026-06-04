import type { Metadata } from "next";
import { FadeInOnScroll } from "@/components/motion";
import { CartasClient } from "@/components/app/CartasClient";

export const metadata: Metadata = { title: "Cartas de legado" };

export default function CartasPage() {
  return (
    <div className="grid gap-6">
      <FadeInOnScroll>
        <h1 className="et-serif text-2xl text-[var(--et-text)]">Cartas de legado</h1>
        <p className="mt-1 text-sm text-[var(--et-text-muted)]">
          Palabras que llegarán justo cuando deban llegar.
        </p>
      </FadeInOnScroll>
      <CartasClient />
    </div>
  );
}
