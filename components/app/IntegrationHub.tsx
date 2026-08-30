"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type IntegrationGroup = "ownership" | "daily" | "context";
type IntegrationItem = {
  slug: string;
  name: string;
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

function IntegrationGlyph({ slug }: { slug: string }) {
  const paths: Record<string, string> = {
    neon: "M5 18V6l7 7 7-7v12M8 9h8",
    gmail: "M4 7v11h16V7l-8 6-8-6Z",
    outlook: "M4 5h10v14H4zM14 8h6v8h-6M7 9c2-2 4 0 4 3s-2 5-4 3-2-4 0-6Z",
    googlecalendar: "M4 6h16v14H4zM8 3v6M16 3v6M4 10h16M8 14h3v3H8z",
    googledrive: "M9 4h6l6 11-3 5H6l-3-5L9 4Zm0 0 6 11m6 0H9m-3 5 6-10",
  };
  return <svg viewBox="0 0 24 24" aria-hidden><path d={paths[slug] ?? "M5 12h14M12 5v14"} /></svg>;
}

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
    const memoryReady = connected.some((item) => item.slug === "neon");
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
        <p>{mode === "onboarding" ? "Neon te da propiedad sobre tu memoria; tu correo aporta contexto cotidiano. Puedes conectar una, ambas o continuar sin hacerlo ahora." : "Las credenciales se guardan cifradas por Composio y no pasan por Eternime. Puedes pausar cada acceso cuando quieras."}</p>
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
              <span className="integration-glyph"><IntegrationGlyph slug={item.slug}/></span>
              <span className={`integration-state ${item.active ? "is-active" : ""}`}><i/>{item.active ? "Conectado" : "Sin conectar"}</span>
            </div>
            <p className="integration-eyebrow">{item.eyebrow}{item.recommended ? " · Recomendado" : ""}</p>
            <h4>{item.name}</h4>
            <p>{item.description}</p>
            <div className="integration-permission"><span aria-hidden>✓</span>{item.permission}</div>
            {item.slug === "neon" && <p className="integration-caveat">Conectar no mueve tu memoria actual. Cualquier migración requerirá tu aprobación explícita.</p>}
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
