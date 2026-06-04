import type { Metadata } from "next";
import { FadeInOnScroll } from "@/components/motion";
import { UsersManager } from "@/components/admin/UsersManager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin · Usuarios" };

export default function AdminUsuariosPage() {
  return (
    <div className="grid gap-6">
      <FadeInOnScroll>
        <h1 className="et-serif text-2xl text-[var(--et-text)]">Usuarios</h1>
        <p className="mt-1 text-sm text-[var(--et-text-muted)]">
          Busca, promueve o elimina cuentas de Eternime.
        </p>
      </FadeInOnScroll>
      <UsersManager />
    </div>
  );
}
