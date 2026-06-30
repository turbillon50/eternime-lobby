"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card, CardDescription, CardTitle } from "@/components/ui";
import type { SocialConnection, SocialProvider } from "@/lib/data/types";

const LABELS: Record<SocialProvider, string> = { facebook: "Facebook", instagram: "Instagram" };

function ProviderRow({
  provider, connection, available, onChange,
}: {
  provider: SocialProvider;
  connection: SocialConnection | undefined;
  available: boolean;
  onChange: () => void;
}) {
  const [importing, setImporting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [result, setResult] = useState("");

  const doImport = async () => {
    setImporting(true); setResult("");
    try {
      const res = await fetch(`/api/social/${provider}/import`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setResult(data.error ?? "No se pudo importar"); return; }
      const n = (data.photosImported ?? data.mediaImported ?? 0) + (data.memoriesCreated ?? 0);
      setResult(n > 0 ? `Listo: ${n} recuerdos nuevos.` : "No habia nada nuevo que importar.");
      onChange();
    } catch { setResult("Error de conexión"); }
    finally { setImporting(false); }
  };

  const disconnect = async () => {
    setDisconnecting(true);
    try { await fetch(`/api/social/connections?provider=${provider}`, { method: "DELETE" }); onChange(); }
    catch { /* ignore */ }
    finally { setDisconnecting(false); }
  };

  if (!available) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[var(--et-radius-sm)] border border-[var(--et-border-soft)] px-4 py-3 opacity-50">
        <span className="text-sm text-[var(--et-text-muted)]">{LABELS[provider]} · aun no configurado</span>
      </div>
    );
  }

  if (!connection) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[var(--et-radius-sm)] border border-[var(--et-border-soft)] px-4 py-3">
        <span className="text-sm text-[var(--et-text)]">{LABELS[provider]}</span>
        <Button variant="ghost" onClick={() => { window.location.href = `/api/social/${provider}/connect`; }}>Conectar</Button>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--et-radius-sm)] border border-[rgba(143,200,160,0.3)] bg-[rgba(143,200,160,0.06)] px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--et-text)]">
            {LABELS[provider]} <span className="text-[var(--et-success)]">conectado</span>
            {connection.provider_user_name ? ` · ${connection.provider_user_name}` : ""}
          </p>
          {connection.last_synced_at ? (
            <p className="mt-0.5 text-xs text-[var(--et-text-faint)]">
              Ultima importacion: {new Date(connection.last_synced_at).toLocaleDateString("es-MX")} ({connection.last_import_count ?? 0} recuerdos)
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={doImport} loading={importing}>Importar fotos y publicaciones</Button>
          <Button variant="ghost" onClick={disconnect} loading={disconnecting}>Desconectar</Button>
        </div>
      </div>
      {result ? <p className="mt-2 text-xs text-[var(--et-text-muted)]">{result}</p> : null}
    </div>
  );
}

export function SocialImport() {
  const [connections, setConnections] = useState<SocialConnection[] | null>(null);
  const [available, setAvailable] = useState({ facebook: false, instagram: false });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/social/connections");
      const data = await res.json();
      setConnections(Array.isArray(data.connections) ? data.connections : []);
      if (data.available) setAvailable(data.available);
    } catch { setConnections([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (connections === null) return null;
  // Si ninguno de los dos esta configurado todavia, no mostramos la tarjeta —
  // evita confundir con un feature que aun no esta activo.
  if (!available.facebook && !available.instagram) return null;

  const byProvider = (p: "facebook" | "instagram") => connections.find((c) => c.provider === p);

  return (
    <Card>
      <CardTitle>Trae tus recuerdos de redes sociales</CardTitle>
      <CardDescription className="mt-1">
        Conecta Facebook o Instagram y trae tus fotos y publicaciones directo a tu bóveda — Eternime las guarda como recuerdos propios, no como un enlace que se puede caer.
      </CardDescription>
      <div className="mt-4 grid gap-2">
        <ProviderRow provider="facebook" connection={byProvider("facebook")} available={available.facebook} onChange={load} />
        <ProviderRow provider="instagram" connection={byProvider("instagram")} available={available.instagram} onChange={load} />
      </div>
    </Card>
  );
}
