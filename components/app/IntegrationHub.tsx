"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

type IntegrationGroup = "ownership" | "daily" | "context";
type IntegrationItem = {
  slug: string;
  name: string;
  icon: string;
  website: string;
  eyebrow: string;
  description: string;
  permission: string;
  group: IntegrationGroup;
  recommended?: boolean;
  active: boolean;
  status: string;
};

type IntegrationResponse = {
  available: boolean;
  integrations: IntegrationItem[];
  error?: string;
};

const GROUPS: { key: IntegrationGroup; title: string; copy: string }[] = [
  { key: "ownership", title: "Tu memoria", copy: "Infraestructura que puede estar a tu nombre." },
  { key: "daily", title: "Tu día a día", copy: "Correo y actividad que se convierten en contexto útil." },
  { key: "context", title: "Tu contexto", copy: "Agenda y documentos que completan tus recuerdos." },
];

export function IntegrationHub({ mode = "full" }: { mode?: "full" | "onboarding" }) {
  const [data, setData] = useState<IntegrationResponse | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/integrations", { cache: "no-store" });
      const payload = (await response.json()) as IntegrationResponse;
      if (!response.ok) throw new Error(payload.error || "No fue posible consultar tus conexiones.");
      setData(payload);
      setError("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No fue posible consultar tus conexiones.");
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/integrations", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as IntegrationResponse;
        if (!response.ok) throw new Error(payload.error || "No fue posible consultar tus conexiones.");
        if (active) setData(payload);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "No fue posible consultar tus conexiones.");
      });
    return () => { active = false; };
  }, []);

  const progress = useMemo(() => {
    const connected = data?.integrations.filter((item) => item.active) ?? [];
    const memoryReady = connected.some((item) => item.slug === "supabase" || item.slug === "neon");
    const dailyReady = connected.some((item) => item.slug === "gmail" || item.slug === "outlook");
    return { connected: connected.length, foundations: Number(memoryReady) + Number(dailyReady) };
  }, [data]);

  async function connect(slug: string) {
    setBusy(slug);
    setError("");
    try {
      const response = await fetch(`/api/integrations/${slug}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: mode }),
      });
      const payload = (await response.json()) as { redirectUrl?: string; error?: string };
      if (!response.ok || !payload.redirectUrl) throw new Error(payload.error || "No fue posible iniciar la conexión.");
      window.location.assign(payload.redirectUrl);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No fue posible iniciar la conexión.");
      setBusy(null);
    }
  }

  async function pause(slug: string, name: string) {
    if (!window.confirm(`¿Pausar el acceso de ${name}? Tus datos no se borrarán.`)) return;
    setBusy(slug);
    setError("");
    try {
      const response = await fetch(`/api/integrations/${slug}/pause`, { method: "POST" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "No fue posible pausar la conexión.");
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No fue posible pausar la conexión.");
    } finally {
      setBusy(null);
    }
  }

  return <section className={`integration-hub ${mode === "onboarding" ? "is-onboarding" : ""}`} aria-busy={!data}>
    <div className="integration-summary">
      <div>
        <p className="integration-overline">{mode === "onboarding" ? "Conexión privada" : "Centro de control"}</p>
        <h2>{mode === "onboarding" ? "Elige una base para comenzar." : "Conecta lo esencial. Tú decides hasta dónde."}</h2>
        <p>{mode === "onboarding" ? "Supabase es la opción sencilla para preparar una base a tu nombre; Neon queda disponible si ya lo usas. Tu correo aporta contexto cotidiano y todo es opcional." : "Las credenciales se guardan cifradas por Composio y no pasan por Eternime. Puedes pausar cada acceso cuando quieras."}</p>
      </div>
      <div className="integration-meter" aria-label={`${progress.foundations} de 2 bases recomendadas conectadas`}>
        <strong>{progress.foundations}<span>/2</span></strong>
        <small>Bases recomendadas</small>
        <div><i style={{ width: `${progress.foundations * 50}%` }} /></div>
      </div>
    </div>

    {!data && !error && <div className="integration-loading" role="status"><span />Preparando tus conexiones…</div>}
    {error && <div className="integration-alert" role="alert">{error}<button type="button" onClick={() => void refresh()}>Reintentar</button></div>}
    {data && !data.available && <div className="integration-notice" role="status"><b>Integraciones preparadas.</b><span>Falta activar la conexión segura de Composio para habilitar estos botones.</span></div>}

    {data && GROUPS.map((group) => {
      const items = data.integrations.filter((item) => item.group === group.key);
      if (mode === "onboarding" && group.key === "context") return null;
      return <div className="integration-group" key={group.key}>
        <div className="integration-group-head"><div><h3>{group.title}</h3><p>{group.copy}</p></div></div>
        <div className="integration-grid">
          {items.map((item) => <article className={`integration-card ${item.active ? "is-connected" : ""}`} key={item.slug}>
            <div className="integration-card-top">
              <span className="integration-glyph">
                <Image src={item.icon} alt="" width={28} height={28} aria-hidden />
              </span>
              <span className={`integration-state ${item.active ? "is-active" : ""}`}><i/>{item.active ? "Conectado" : "Sin conectar"}</span>
            </div>
            <p className="integration-eyebrow">{item.eyebrow}{item.recommended ? " · Recomendado" : ""}</p>
            <h4>{item.name}</h4>
            <p>{item.description}</p>
            <div className="integration-permission"><span aria-hidden>✓</span>{item.permission}</div>
            {(item.slug === "supabase" || item.slug === "neon") && <p className="integration-caveat">Conectar prepara el acceso; no mueve tu memoria actual. Cualquier migración requerirá tu aprobación explícita.</p>}
            <a className="integration-official-link" href={item.website} target="_blank" rel="noopener noreferrer" aria-label={`Abrir sitio oficial de ${item.name} en una pestaña nueva`}>
              <span>Sitio oficial</span>
              <svg viewBox="0 0 24 24" aria-hidden><path d="M14 5h5v5M19 5l-9 9M19 14v5H5V5h5" /></svg>
            </a>
            <div className="integration-actions">
              {item.active
                ? <button type="button" className="integration-secondary" disabled={busy === item.slug} onClick={() => void pause(item.slug, item.name)}>{busy === item.slug ? "Pausando…" : "Pausar acceso"}</button>
                : <button type="button" className="integration-primary" disabled={!data.available || busy === item.slug} onClick={() => void connect(item.slug)}>{busy === item.slug ? "Abriendo…" : `Conectar ${item.name}`}</button>}
            </div>
          </article>)}
        </div>
      </div>;
    })}
  </section>;
}
