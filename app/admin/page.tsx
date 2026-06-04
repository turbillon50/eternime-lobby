import type { Metadata } from "next";
import { getAdminKpis, getSignupsByDay, getRecentSignups } from "@/lib/data/admin";
import { hasDb } from "@/lib/db";
import { FadeInOnScroll, NumberCounter, StaggerContainer, StaggerItem } from "@/components/motion";
import { Badge, Card, CardDescription, CardTitle, EmptyState } from "@/components/ui";
import { SignupsChart } from "@/components/admin/SignupsChart";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin · Panel" };

const KPI_DEFS: { key: keyof NonNullable<Awaited<ReturnType<typeof getAdminKpis>>>; label: string }[] = [
  { key: "totalUsers", label: "Usuarios totales" },
  { key: "newUsers7d", label: "Nuevos · 7 días" },
  { key: "totalMemories", label: "Recuerdos" },
  { key: "scheduledLetters", label: "Cartas programadas" },
  { key: "guideMessages", label: "Mensajes de guía" },
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export default async function AdminPage() {
  if (!hasDb()) {
    return (
      <div className="grid gap-6">
        <h1 className="et-serif text-2xl text-[var(--et-text)]">Panel de administración</h1>
        <EmptyState
          title="Base de datos no conectada"
          description="Configura DATABASE_URL para ver las métricas de Eternime."
        />
      </div>
    );
  }

  const [kpis, signups, recent] = await Promise.all([
    getAdminKpis(),
    getSignupsByDay(),
    getRecentSignups(10),
  ]);

  return (
    <div className="grid gap-6">
      <FadeInOnScroll>
        <h1 className="et-serif text-2xl text-[var(--et-text)]">Panel de administración</h1>
        <p className="mt-1 text-sm text-[var(--et-text-muted)]">Visión global de Eternime.</p>
      </FadeInOnScroll>

      <StaggerContainer className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {KPI_DEFS.map((def) => (
          <StaggerItem key={def.key}>
            <Card className="h-full">
              <NumberCounter
                value={kpis?.[def.key] ?? 0}
                className="et-serif text-3xl text-[var(--et-gold-bright)] sm:text-4xl"
              />
              <CardDescription className="mt-1.5 text-xs uppercase tracking-[0.1em]">
                {def.label}
              </CardDescription>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <FadeInOnScroll delay={0.1}>
        <Card>
          <CardTitle className="mb-4">Registros por día</CardTitle>
          {signups.length > 0 ? (
            <SignupsChart data={signups} />
          ) : (
            <CardDescription>Sin datos de registros aún.</CardDescription>
          )}
        </Card>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.15}>
        <Card>
          <CardTitle className="mb-4">Últimas altas</CardTitle>
          {recent.length === 0 ? (
            <EmptyState title="Sin usuarios todavía" description="Las nuevas cuentas aparecerán aquí." />
          ) : (
            <ul className="grid gap-2">
              {recent.map((u) => (
                <li
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--et-radius-sm)] border border-[var(--et-border-soft)] px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-[var(--et-text)]">{u.name}</p>
                    <p className="truncate text-xs text-[var(--et-text-faint)]">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={u.role === "admin" ? "gold" : "muted"}>{u.role}</Badge>
                    <span className="text-xs text-[var(--et-text-muted)]">{formatDate(u.created_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </FadeInOnScroll>
    </div>
  );
}
