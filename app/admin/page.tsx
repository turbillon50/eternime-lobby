import type { Metadata } from "next";
import { countUsers } from "@/lib/data/users";
import { FadeInOnScroll, NumberCounter } from "@/components/motion";
import { Card, CardDescription, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const users = await countUsers();

  return (
    <div className="grid gap-6">
      <FadeInOnScroll>
        <h1 className="et-serif text-2xl text-[var(--et-text)]">Panel de administración</h1>
        <p className="mt-1 text-sm text-[var(--et-text-muted)]">Visión global de Eternime.</p>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.1}>
        <Card className="max-w-xs">
          <NumberCounter value={users} className="et-serif text-4xl text-[var(--et-gold-bright)]" />
          <CardDescription className="mt-2">Cuentas creadas</CardDescription>
        </Card>
      </FadeInOnScroll>

      <EmptyState
        title="Más métricas en camino"
        description="Los agentes de Fase 2 construirán aquí la gestión de usuarios, contenido y entregas."
      />
    </div>
  );
}
