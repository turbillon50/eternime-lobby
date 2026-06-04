"use client";

/** Overview de recuerdos y cartas con filtros y eliminación de contenido inapropiado. */
import { useCallback, useEffect, useState } from "react";
import { StaggerContainer, StaggerItem } from "@/components/motion";
import { Badge, Button, Card, CardTitle, Modal, SkeletonCard, EmptyState } from "@/components/ui";
import type { AdminLetterRow, AdminMemoryRow, ContentCounts } from "@/lib/data/admin";

const MEMORY_KINDS = ["", "texto", "carta", "voz", "foto", "video"];
const LETTER_STATUSES = ["", "draft", "scheduled", "delivered"];

const statusTone: Record<string, "gold" | "muted" | "success" | "danger"> = {
  draft: "muted",
  scheduled: "gold",
  delivered: "success",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

type PendingDelete = { type: "memory" | "letter"; id: string; label: string };

export function ContentManager() {
  const [counts, setCounts] = useState<ContentCounts | null>(null);
  const [memories, setMemories] = useState<AdminMemoryRow[]>([]);
  const [letters, setLetters] = useState<AdminLetterRow[]>([]);
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingDelete | null>(null);
  const [busy, setBusy] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/content", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al cargar contenido");
      setCounts(data.counts ?? null);
      setMemories(data.memories ?? []);
      setLetters(data.letters ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar contenido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function loadMemories(k: string) {
    setKind(k);
    const res = await fetch(`/api/admin/content?type=memories&kind=${encodeURIComponent(k)}`, { cache: "no-store" });
    const data = await res.json();
    if (res.ok) setMemories(data.memories ?? []);
  }

  async function loadLetters(s: string) {
    setStatus(s);
    const res = await fetch(`/api/admin/content?type=letters&status=${encodeURIComponent(s)}`, { cache: "no-store" });
    const data = await res.json();
    if (res.ok) setLetters(data.letters ?? []);
  }

  async function confirmDelete() {
    if (!pending) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: pending.type, id: pending.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al eliminar");
      if (pending.type === "memory") {
        setMemories((prev) => prev.filter((m) => m.id !== pending.id));
      } else {
        setLetters((prev) => prev.filter((l) => l.id !== pending.id));
      }
      setPending(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {error ? <p className="text-sm text-[var(--et-danger)]">{error}</p> : null}

      <StaggerContainer className="grid gap-3 sm:grid-cols-2">
        <StaggerItem>
          <Card className="h-full">
            <CardTitle className="mb-3">Recuerdos por tipo</CardTitle>
            {counts && counts.memoriesByKind.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {counts.memoriesByKind.map((c) => (
                  <Badge key={c.kind} tone="gold">
                    {c.kind} · {c.count}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--et-text-muted)]">Sin recuerdos aún.</p>
            )}
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="h-full">
            <CardTitle className="mb-3">Cartas por estado</CardTitle>
            {counts && counts.lettersByStatus.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {counts.lettersByStatus.map((c) => (
                  <Badge key={c.status} tone={statusTone[c.status] ?? "muted"}>
                    {c.status} · {c.count}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--et-text-muted)]">Sin cartas aún.</p>
            )}
          </Card>
        </StaggerItem>
      </StaggerContainer>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Recuerdos recientes</CardTitle>
          <div className="flex flex-wrap gap-1.5">
            {MEMORY_KINDS.map((k) => (
              <button
                key={k || "todos"}
                type="button"
                onClick={() => void loadMemories(k)}
                className={`rounded-full border px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.1em] transition ${
                  kind === k
                    ? "border-[var(--et-gold)] text-[var(--et-gold-bright)]"
                    : "border-[var(--et-border-soft)] text-[var(--et-text-faint)] hover:text-[var(--et-text)]"
                }`}
              >
                {k || "todos"}
              </button>
            ))}
          </div>
        </div>
        {memories.length === 0 ? (
          <EmptyState title="Sin recuerdos" description="No hay recuerdos con este filtro." />
        ) : (
          <ul className="grid gap-2">
            {memories.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--et-radius-sm)] border border-[var(--et-border-soft)] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-[var(--et-text)]">{m.title}</p>
                  <p className="truncate text-xs text-[var(--et-text-faint)]">
                    {m.user_name} · {m.user_email} · {formatDate(m.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="muted">{m.kind}</Badge>
                  {m.emotional_tone ? <Badge tone="gold">{m.emotional_tone}</Badge> : null}
                  <Button
                    variant="ghost"
                    className="!px-2.5 !py-1.5 text-xs !text-[var(--et-danger)]"
                    onClick={() => setPending({ type: "memory", id: m.id, label: m.title })}
                  >
                    Eliminar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Cartas recientes</CardTitle>
          <div className="flex flex-wrap gap-1.5">
            {LETTER_STATUSES.map((s) => (
              <button
                key={s || "todas"}
                type="button"
                onClick={() => void loadLetters(s)}
                className={`rounded-full border px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.1em] transition ${
                  status === s
                    ? "border-[var(--et-gold)] text-[var(--et-gold-bright)]"
                    : "border-[var(--et-border-soft)] text-[var(--et-text-faint)] hover:text-[var(--et-text)]"
                }`}
              >
                {s || "todas"}
              </button>
            ))}
          </div>
        </div>
        {letters.length === 0 ? (
          <EmptyState title="Sin cartas" description="No hay cartas con este filtro." />
        ) : (
          <ul className="grid gap-2">
            {letters.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--et-radius-sm)] border border-[var(--et-border-soft)] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-[var(--et-text)]">
                    {l.title} → {l.recipient_name}
                  </p>
                  <p className="truncate text-xs text-[var(--et-text-faint)]">
                    {l.user_name} · {l.user_email} · entrega {formatDate(l.deliver_on)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={statusTone[l.status] ?? "muted"}>{l.status}</Badge>
                  <Button
                    variant="ghost"
                    className="!px-2.5 !py-1.5 text-xs !text-[var(--et-danger)]"
                    onClick={() => setPending({ type: "letter", id: l.id, label: l.title })}
                  >
                    Eliminar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={Boolean(pending)} onClose={() => setPending(null)} title="Eliminar contenido">
        <p className="text-sm text-[var(--et-text-muted)]">
          Vas a eliminar {pending?.type === "memory" ? "el recuerdo" : "la carta"}{" "}
          <span className="text-[var(--et-text)]">“{pending?.label}”</span>. Esta acción no se puede deshacer.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setPending(null)}>
            Cancelar
          </Button>
          <Button variant="primary" className="!bg-[var(--et-danger)]" loading={busy} onClick={() => void confirmDelete()}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
