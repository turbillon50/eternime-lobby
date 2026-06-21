"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Modal } from "@/components/ui";

/** Ícono de usuario en el header que abre el flujo de acceso (sheet/modal). */
export function AuthSheet() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "No se pudo entrar"); return; }
      router.push("/app"); router.refresh();
    } catch { setError("Error de conexión"); }
    finally { setLoading(false); }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Entrar a tu cuenta"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--et-border)] text-[var(--et-gold-bright)] transition hover:bg-[rgba(212,175,106,0.1)]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Entra a tu legado">
        <form onSubmit={onSubmit} className="grid gap-4">
          <Input label="Correo" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Contraseña" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error ? <p className="text-sm text-[var(--et-danger)]">{error}</p> : null}
          <Button type="submit" loading={loading}>Entrar</Button>
          <p className="text-center text-sm text-[var(--et-text-muted)]">
            ¿Aún no tienes cuenta? <Link href="/crear" onClick={() => setOpen(false)} className="text-[var(--et-gold-bright)] hover:underline">Crear mi legado</Link>
          </p>
        </form>
      </Modal>
    </>
  );
}
