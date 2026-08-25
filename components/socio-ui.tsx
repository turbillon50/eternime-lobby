"use client";

import { useState } from "react";

export function CopiarLink({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // clipboard bloqueado: el input queda seleccionable
    }
  };
  return (
    <div className="mt-3 flex w-full items-center gap-2">
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="et-card w-full rounded-[var(--et-radius)] px-4 py-3 text-sm"
      />
      <button
        type="button"
        onClick={copiar}
        className="shrink-0 rounded-[var(--et-radius)] bg-[var(--et-accent,#c9a86a)] px-4 py-3 text-sm font-medium text-black"
      >
        {copiado ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}

export function BotonPaquete({ paquete, className, children }: { paquete: "socio" | "master"; className?: string; children: React.ReactNode }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ir = async () => {
    if (cargando) return;
    setCargando(true);
    setError(null);
    try {
      const r = await fetch("/api/checkout/socio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paquete }),
      });
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
    <div className="w-full">
      <button type="button" onClick={ir} disabled={cargando} className={className}>
        {cargando ? "Abriendo pago seguro..." : children}
      </button>
      {error ? <p className="mt-2 text-xs text-[var(--et-text-muted)]">{error}</p> : null}
    </div>
  );
}
