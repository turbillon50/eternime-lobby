"use client";

/** Gestión de usuarios: búsqueda, paginación, role toggle, eliminación con Modal. */
import { useCallback, useEffect, useState } from "react";
import { StaggerContainer, StaggerItem } from "@/components/motion";
import { Badge, Button, Card, Input, Modal, SkeletonCard, EmptyState } from "@/components/ui";
import type { AdminUserRow } from "@/lib/data/admin";

const PAGE_SIZE = 12;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export function UsersManager() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<AdminUserRow | null>(null);

  const load = useCallback(async (q: string, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(q)}&page=${p}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al cargar usuarios");
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(query, page);
  }, [load, query, page]);

  // Debounce de búsqueda
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setQuery(search);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  async function toggleRole(u: AdminUserRow) {
    setBusyId(u.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: u.id, role: u.role === "admin" ? "user" : "admin" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al cambiar rol");
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: data.user.role } : x)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cambiar rol");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setBusyId(toDelete.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: toDelete.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al eliminar");
      setToDelete(null);
      void load(query, page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setBusyId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <Input
            label="Buscar"
            placeholder="Nombre o correo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <p className="text-xs uppercase tracking-[0.12em] text-[var(--et-text-faint)]">
          {total} usuario{total === 1 ? "" : "s"}
        </p>
      </div>

      {error ? <p className="text-sm text-[var(--et-danger)]">{error}</p> : null}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description={query ? `Nadie coincide con “${query}”.` : "Aún no hay usuarios registrados."}
        />
      ) : (
        <StaggerContainer className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => (
            <StaggerItem key={u.id}>
              <Card className="grid h-full gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-[var(--et-text)]">{u.name}</p>
                    <p className="truncate text-xs text-[var(--et-text-faint)]">{u.email}</p>
                  </div>
                  <Badge tone={u.role === "admin" ? "gold" : "muted"}>{u.role}</Badge>
                </div>
                <p className="text-xs text-[var(--et-text-muted)]">
                  {u.memories_count} recuerdos · {u.letters_count} cartas · alta {formatDate(u.created_at)}
                </p>
                <div className="mt-auto flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1 !px-3 !py-2 text-xs"
                    loading={busyId === u.id}
                    onClick={() => void toggleRole(u)}
                  >
                    {u.role === "admin" ? "Quitar admin" : "Hacer admin"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="!px-3 !py-2 text-xs !text-[var(--et-danger)]"
                    disabled={busyId === u.id}
                    onClick={() => setToDelete(u)}
                  >
                    Eliminar
                  </Button>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <Button variant="ghost" className="!px-3 !py-2 text-xs" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Anterior
          </Button>
          <span className="text-xs text-[var(--et-text-muted)]">
            Página {page} de {totalPages}
          </span>
          <Button variant="ghost" className="!px-3 !py-2 text-xs" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Siguiente →
          </Button>
        </div>
      ) : null}

      <Modal open={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Eliminar usuario">
        <p className="text-sm text-[var(--et-text-muted)]">
          Vas a eliminar a <span className="text-[var(--et-text)]">{toDelete?.name}</span> ({toDelete?.email}) y{" "}
          <span className="text-[var(--et-danger)]">todo su contenido</span>: recuerdos, cartas, beneficiarios y
          conversaciones de guía. Esta acción no se puede deshacer.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setToDelete(null)}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            className="!bg-[var(--et-danger)]"
            loading={busyId === toDelete?.id}
            onClick={() => void confirmDelete()}
          >
            Eliminar definitivamente
          </Button>
        </div>
      </Modal>
    </div>
  );
}
