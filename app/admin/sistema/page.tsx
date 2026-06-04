import type { Metadata } from "next";
import { hasDb } from "@/lib/db";
import { getSystemHealth } from "@/lib/data/admin";
import { FadeInOnScroll, NumberCounter, StaggerContainer, StaggerItem } from "@/components/motion";
import { Badge, Card, CardDescription, CardTitle, EmptyState } from "@/components/ui";
import { PromoteAdminForm } from "@/components/admin/PromoteAdminForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin · Sistema" };

function formatDateTime(iso: string | null): string {
  if (!iso) return "sin registros";
  try {
    return new Date(iso).toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default async function AdminSistemaPage() {
  const connected = hasDb();
  let health: Awaited<ReturnType<typeof getSystemHealth>> = [];
  let dbError: string | null = null;
  if (connected) {
    try {
      health = await getSystemHealth();
    } catch (e) {
      dbError = e instanceof Error ? e.message : "Error consultando la base de datos";
    }
  }

  return (
    <div className="grid gap-6">
      <FadeInOnScroll>
        <h1 className="et-serif text-2xl text-[var(--et-text)]">Sistema</h1>
        <p className="mt-1 text-sm text-[var(--et-text-muted)]">Salud de la plataforma y operaciones rápidas.</p>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.05}>
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Base de datos</CardTitle>
              <CardDescription className="mt-1">
                {connected
                  ? dbError
                    ? `DATABASE_URL definida pero la consulta falló: ${dbError}`
                    : "Conexión a Neon Postgres activa."
                  : "DATABASE_URL no está configurada — la plataforma opera en modo degradado."}
              </CardDescription>
            </div>
            <Badge tone={connected && !dbError ? "success" : "danger"}>
              {connected ? (dbError ? "error" : "conectada") : "sin conexión"}
            </Badge>
          </div>
        </Card>
      </FadeInOnScroll>

      {connected && !dbError ? (
        <StaggerContainer className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {health.map((t) => (
            <StaggerItem key={t.table}>
              <Card className="h-full">
                <p className="mb-2 break-all text-xs uppercase tracking-[0.12em] text-[var(--et-text-faint)]">
                  {t.table}
                </p>
                <NumberCounter value={t.count} className="et-serif text-3xl text-[var(--et-gold-bright)]" />
                <CardDescription className="mt-2 text-xs">
                  Último registro: {formatDateTime(t.lastCreatedAt)}
                </CardDescription>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      ) : (
        <EmptyState
          title="Sin métricas de tablas"
          description="Cuando la base de datos esté conectada verás counts y últimos registros de cada tabla eternime_*."
        />
      )}

      <FadeInOnScroll delay={0.1}>
        <PromoteAdminForm />
      </FadeInOnScroll>
    </div>
  );
}
