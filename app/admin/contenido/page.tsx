import type { Metadata } from "next";
import { FadeInOnScroll } from "@/components/motion";
import { ContentManager } from "@/components/admin/ContentManager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin · Contenido" };

export default function AdminContenidoPage() {
  return (
    <div className="grid gap-6">
      <FadeInOnScroll>
        <h1 className="et-serif text-2xl text-[var(--et-text)]">Contenido</h1>
        <p className="mt-1 text-sm text-[var(--et-text-muted)]">
          Recuerdos y cartas de toda la plataforma — modera lo inapropiado.
        </p>
      </FadeInOnScroll>
      <ContentManager />
    </div>
  );
}
