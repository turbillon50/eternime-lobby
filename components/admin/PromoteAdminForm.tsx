"use client";

/** Bloque "Promover admin": email + botón → PATCH /api/admin/users. */
import { useState } from "react";
import { Button, Card, CardTitle, Input } from "@/components/ui";

export function PromoteAdminForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function promote() {
    if (!email.trim()) {
      setMessage({ ok: false, text: "Escribe un correo." });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role: "admin" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al promover");
      setMessage({ ok: true, text: `${data.user.email} ahora es admin.` });
      setEmail("");
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Error al promover" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardTitle className="mb-1">Promover admin</CardTitle>
      <p className="mb-4 text-sm text-[var(--et-text-muted)]">
        Da rol admin a una cuenta existente por su correo.
      </p>
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          void promote();
        }}
      >
        <div className="flex-1">
          <Input
            label="Correo"
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button variant="primary" loading={busy} type="submit">
          Promover
        </Button>
      </form>
      {message ? (
        <p className={`mt-3 text-sm ${message.ok ? "text-[var(--et-success)]" : "text-[var(--et-danger)]"}`}>
          {message.text}
        </p>
      ) : null}
    </Card>
  );
}
