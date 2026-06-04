import type { Metadata } from "next";
import { FadeInOnScroll } from "@/components/motion";
import { PerfilClient } from "@/components/app/PerfilClient";

export const metadata: Metadata = { title: "Perfil" };

export default function PerfilPage() {
  return (
    <div className="grid gap-6">
      <FadeInOnScroll>
        <h1 className="et-serif text-2xl text-[var(--et-text)]">Perfil</h1>
        <p className="mt-1 text-sm text-[var(--et-text-muted)]">Tu cuenta, tu sesión y tu legado.</p>
      </FadeInOnScroll>
      <PerfilClient />
    </div>
  );
}
