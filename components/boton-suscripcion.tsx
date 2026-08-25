"use client";

import { useState } from "react";

export function BotonSuscripcion({ className, children }: { className?: string; children: React.ReactNode }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ir = async () => {
    if (cargando) return;
    setCargando(true);
    setError(null);
    try {
      const r = await fetch("/api/checkout", { method: "POST" });
      const d = (await r.json()) as { url?: string; error?: string };
      if (r.status === 401) {
        window.location.href = "/crear";
        return;
      }
      if (d.url) {
        window.location.href = d.url;
        return;
      }
      setError(d.error ?? "No se pudo iniciar el pago.");
    } catch {
      setError("No se pudo iniciar el pago.");
    }
    setCargando(false);
  };

  return (
    <div className="mt-8 w-full">
      <button type="button" onClick={ir} disabled={cargando} className={className}>
        {cargando ? "Abriendo pago seguro..." : children}
      </button>
      {error ? <p className="mt-2 text-center text-xs text-[var(--et-text-muted)]">{error}</p> : null}
    </div>
  );
}
