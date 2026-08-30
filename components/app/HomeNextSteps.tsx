"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type CheckState = boolean | null;
type IntegrationPayload = { integrations?: { slug: string; active: boolean }[] };
type McpPayload = { connections?: { revoked_at: string | null }[] };
type MemoriesPayload = { memories?: unknown[] };

type ProgressState = {
  ownership: CheckState;
  daily: CheckState;
  mcp: CheckState;
  memory: CheckState;
};

const EMPTY_PROGRESS: ProgressState = { ownership: null, daily: null, mcp: null, memory: null };
const HOME_TASKS = [
  {
    key: "ownership" as const,
    index: "01",
    title: "Prepara una memoria propia",
    copy: "Conecta Supabase fácilmente o usa Neon si ya tienes una API key.",
    href: "/app/bienvenida?step=2",
    action: "Conectar",
    badge: "Composio",
  },
  {
    key: "daily" as const,
    index: "02",
    title: "Conecta tu día a día",
    copy: "Correo, agenda y archivos pueden convertirse en contexto útil.",
    href: "/app/bienvenida?step=2",
    action: "Elegir servicios",
    badge: "Composio",
  },
  {
    key: "mcp" as const,
    index: "03",
    title: "Activa Eternime en tu IA",
    copy: "Lleva tu memoria autorizada a ChatGPT, Claude o Grok mediante MCP.",
    href: "/app/ias",
    action: "Configurar MCP",
    badge: "MCP",
  },
  {
    key: "memory" as const,
    index: "04",
    title: "Guarda tu primer recuerdo",
    copy: "Empieza con una idea, una decisión, una persona o un momento.",
    href: "/app/recuerdos",
    action: "Guardar recuerdo",
    badge: "Memoria",
  },
];

async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || "No fue posible revisar este paso.");
  return payload;
}

async function loadProgress(): Promise<ProgressState> {
  const [integrations, mcp, memories] = await Promise.allSettled([
    readJson<IntegrationPayload>("/api/integrations"),
    readJson<McpPayload>("/api/mcp/tokens"),
    readJson<MemoriesPayload>("/api/memories"),
  ]);

  const connected = integrations.status === "fulfilled"
    ? integrations.value.integrations?.filter((item) => item.active) ?? []
    : null;

  return {
    ownership: connected ? connected.some((item) => item.slug === "supabase" || item.slug === "neon") : null,
    daily: connected ? connected.some((item) => ["gmail", "outlook", "googlecalendar", "googledrive"].includes(item.slug)) : null,
    mcp: mcp.status === "fulfilled"
      ? (mcp.value.connections ?? []).some((connection) => !connection.revoked_at)
      : null,
    memory: memories.status === "fulfilled" ? (memories.value.memories?.length ?? 0) > 0 : null,
  };
}

export function HomeNextSteps() {
  const [progress, setProgress] = useState<ProgressState>(EMPTY_PROGRESS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setProgress(await loadProgress());
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    void loadProgress().then((next) => {
      if (!active) return;
      setProgress(next);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const completed = HOME_TASKS.filter((task) => progress[task.key] === true).length;
  const hasUnknown = HOME_TASKS.some((task) => progress[task.key] === null);

  return (
    <section className="home-next" aria-labelledby="home-next-title" aria-busy={loading}>
      <header className="home-next__head">
        <div>
          <p>Tu espacio</p>
          <h1 id="home-next-title">Qué sigue</h1>
          <span>{loading ? "Revisando tu avance…" : hasUnknown ? "Hay pasos que no pudimos verificar." : `${completed} de ${HOME_TASKS.length} pasos completados`}</span>
        </div>
        <Link href="/app/integraciones">Administrar conexiones</Link>
      </header>

      <div className="home-next__progress" aria-hidden>
        <i style={{ width: `${loading ? 0 : (completed / HOME_TASKS.length) * 100}%` }} />
      </div>

      <div className="home-next__grid">
        {HOME_TASKS.map((task) => {
          const state = progress[task.key];
          return (
            <article className={`home-task ${state === true ? "is-done" : ""}`} key={task.key}>
              <div className="home-task__meta"><span>{state === true ? "✓" : task.index}</span><small>{task.badge}</small></div>
              <div className="home-task__copy"><h2>{task.title}</h2><p>{task.copy}</p></div>
              <Link href={task.href}>{state === true ? "Revisar" : state === null && !loading ? "Verificar" : task.action}<svg viewBox="0 0 24 24" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg></Link>
            </article>
          );
        })}
      </div>

      {hasUnknown && !loading && <button className="home-next__retry" type="button" onClick={() => void refresh()}>Volver a revisar</button>}
    </section>
  );
}
