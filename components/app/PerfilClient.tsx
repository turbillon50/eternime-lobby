"use client";

import { useCallback, useEffect, useState } from "react";
import { FadeInOnScroll } from "@/components/motion";
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardTitle,
  Input,
  Modal,
  SkeletonCard,
} from "@/components/ui";

type ProfileUser = {
  id: string;
  email: string;
  name: string;
  role?: string;
  created_at?: string;
};

export function PerfilClient() {
  const [user, setUser] = useState<ProfileUser | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data.user ?? null);
      if (data.user?.name) setName(data.user.name);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveName = async () => {
    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setSavingName(true);
    setError("");
    setSavedOk(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar");
        return;
      }
      setUser(data.user);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2500);
    } catch {
      setError("Error de conexión");
    } finally {
      setSavingName(false);
    }
  };

  const logout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch {
      setLoggingOut(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      if (res.ok) {
        window.location.href = "/";
        return;
      }
      const data = await res.json();
      setError(data.error ?? "No se pudo eliminar la cuenta");
      setConfirmDelete(false);
    } catch {
      setError("Error de conexión");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  if (user === undefined) {
    return (
      <div className="grid gap-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={3} />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <FadeInOnScroll>
        <Card>
          <div className="flex items-center gap-4">
            <div className="et-glow-ring flex h-14 w-14 items-center justify-center rounded-full text-lg text-[var(--et-gold-bright)]">
              {user?.name ? user.name.charAt(0).toUpperCase() : "·"}
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate">{user?.name ?? "Tu nombre"}</CardTitle>
              <CardDescription className="truncate">{user?.email}</CardDescription>
            </div>
            {user?.role === "admin" ? <Badge className="ml-auto">admin</Badge> : null}
          </div>
        </Card>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.08}>
        <Card>
          <CardTitle>Tu nombre</CardTitle>
          <CardDescription className="mt-1">
            Así te saludará tu guía y así firmarás tus cartas de legado.
          </CardDescription>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <Input value={name} onChange={(e) => setName(e.target.value)} aria-label="Nombre" />
            </div>
            <Button onClick={saveName} loading={savingName}>
              Guardar
            </Button>
          </div>
          {savedOk ? <p className="mt-2 text-sm text-[var(--et-success)]">Nombre actualizado</p> : null}
          {error ? <p className="mt-2 text-sm text-[var(--et-danger)]">{error}</p> : null}
        </Card>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.14}>
        <Card>
          <CardTitle>Sesión</CardTitle>
          <CardDescription className="mt-1">Cierra tu sesión en este dispositivo.</CardDescription>
          <div className="mt-4">
            <Button variant="secondary" onClick={logout} loading={loggingOut}>
              Cerrar sesión
            </Button>
          </div>
        </Card>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.2}>
        <Card className="!border-[rgba(224,122,106,0.35)]">
          <CardTitle className="!text-[var(--et-danger)]">Zona de peligro</CardTitle>
          <CardDescription className="mt-1">
            Eliminar tu cuenta borra para siempre tus recuerdos, cartas, beneficiarios y conversaciones con tu
            guía. No hay vuelta atrás.
          </CardDescription>
          <div className="mt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteText("");
                setConfirmDelete(true);
              }}
              className="!border-[rgba(224,122,106,0.4)] !bg-[rgba(224,122,106,0.12)] !text-[var(--et-danger)]"
            >
              Eliminar mi cuenta
            </Button>
          </div>
        </Card>
      </FadeInOnScroll>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="¿Eliminar tu cuenta?">
        <div className="grid gap-4">
          <p className="text-sm text-[var(--et-text-muted)]">
            Todo tu legado — recuerdos, cartas programadas, beneficiarios y la memoria de tu guía — se
            eliminará de forma permanente. Escribe <strong className="text-[var(--et-danger)]">ELIMINAR</strong>{" "}
            para confirmar.
          </p>
          <Input
            value={deleteText}
            onChange={(e) => setDeleteText(e.target.value)}
            placeholder="ELIMINAR"
            aria-label="Confirmación de eliminación"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Conservar mi legado
            </Button>
            <Button
              variant="secondary"
              onClick={deleteAccount}
              loading={deleting}
              disabled={deleteText.trim().toUpperCase() !== "ELIMINAR"}
              className="!border-[rgba(224,122,106,0.4)] !bg-[rgba(224,122,106,0.12)] !text-[var(--et-danger)]"
            >
              Eliminar definitivamente
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
