"use client";

/** Cola de entrega: cartas con deliver_on próximas. Corazón operativo de Luis. */
import { useCallback, useEffect, useState } from "react";
import { StaggerContainer, StaggerItem } from "@/components/motion";
import { Badge, Button, Card, Modal, SkeletonCard, EmptyState } from "@/components/ui";
import type { AdminLetterRow } from "@/lib/data/admin";

const statusTone: Record<string, "gold" | "muted" | "success" | "danger"> = {
  draft: "muted",
  scheduled: "gold",
  delivered: "success",
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

export function DeliveryQueue() {
  const [letters, setLetters] = useState<AdminLetterRow[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toDeliver, setToDeliver] = useState<AdminLetterRow | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (d: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/letters?days=${d}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al cargar la cola");
      setLetters(data.letters ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar la cola");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(days);
  }, [load, days]);

  async function markDelivered() {
    if (!toDeliver) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/letters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: toDeliver.id, status: "delivered" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al marcar entregada");
      setLetters((prev) => prev.filter((l) => l.id !== toDeliver.id));
      setToDeliver(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al marcar entregada");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                days === d
                  ? "border-[var(--et-gold)] text-[var(--et-gold-bright)]"
                  : "border-[var(--et-border-soft)] text-[var(--et-text-faint)] hover:text-[var(--et-text)]"
              }`}
            >
              {d} días
            </button>
          ))}
        </div>
        <p className="text-xs uppercase tracking-[0.12em] text-[var(--et-text-faint)]">
          {letters.length} carta{letters.length === 1 ? "" : "s"} en cola
        </p>
      </div>

      {error ? <p className="text-sm text-[var(--et-danger)]">{error}</p> : null}

      {loading ? (
        <div className="grid gap-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : letters.length === 0 ? (
        <EmptyState
          title="Cola vacía"
          description={`No hay cartas programadas para los próximos ${days} días.`}
        />
      ) : (
        <StaggerContainer className="grid gap-3">
          {letters.map((l) => {
            const d = daysUntil(l.deliver_on);
            const overdue = d !== null && d < 0;
            return (
              <StaggerItem key={l.id}>
                <Card className="grid gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-[var(--et-text)]">
                        {l.title} → <span className="text-[var(--et-gold-bright)]">{l.recipient_name}</span>
                      </p>
                      <p className="truncate text-xs text-[var(--et-text-faint)]">
                        De {l.user_name} ({l.user_email})
                        {l.recipient_email ? ` · para ${l.recipient_email}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {overdue ? <Badge tone="danger">vencida</Badge> : null}
                      <Badge tone={statusTone[l.status] ?? "muted"}>{l.status}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-[var(--et-text-muted)]">
                      Entrega: <span className="text-[var(--et-text)]">{formatDate(l.deliver_on)}</span>
                      {d !== null ? (
                        <span className={overdue ? "text-[var(--et-danger)]" : "text-[var(--et-gold-bright)]"}>
                          {" "}
                          ({overdue ? `hace ${Math.abs(d)} día${Math.abs(d) === 1 ? "" : "s"}` : d === 0 ? "hoy" : `en ${d} día${d === 1 ? "" : "s"}`})
                        </span>
                      ) : null}
                    </p>
                    <Button
                      variant="secondary"
                      className="!px-3 !py-2 text-xs"
                      onClick={() => setToDeliver(l)}
                    >
                      Marcar entregada
                    </Button>
                  </div>
                </Card>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}

      <Modal open={Boolean(toDeliver)} onClose={() => setToDeliver(null)} title="Confirmar entrega">
        <p className="text-sm text-[var(--et-text-muted)]">
          ¿Marcar la carta <span className="text-[var(--et-text)]">“{toDeliver?.title}”</span> para{" "}
          <span className="text-[var(--et-gold-bright)]">{toDeliver?.recipient_name}</span> como entregada?
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setToDeliver(null)}>
            Cancelar
          </Button>
          <Button variant="primary" loading={busy} onClick={() => void markDelivered()}>
            Sí, entregada
          </Button>
        </div>
      </Modal>
    </div>
  );
}
