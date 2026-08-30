"use client";

import { useEffect, useState } from "react";

type Scope = "identity.read" | "memory.read" | "memory.write" | "projects.read" | "projects.write" | "tasks.read" | "tasks.write" | "network.search" | "network.write";
type Conn = {
  id: string;
  label: string;
  provider: string;
  scopes: Scope[];
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  can_reveal?: boolean;
};

const ALL: Scope[] = ["identity.read", "memory.read", "memory.write", "projects.read", "projects.write", "tasks.read", "tasks.write", "network.search", "network.write"];
const LABELS: Record<Scope, string> = {
  "identity.read": "Leer identidad",
  "memory.read": "Consultar memoria",
  "memory.write": "Guardar memoria",
  "projects.read": "Consultar proyectos",
  "projects.write": "Crear y actualizar proyectos",
  "tasks.read": "Consultar pendientes",
  "tasks.write": "Crear y actualizar pendientes",
  "network.search": "Consultar Mi Red",
  "network.write": "Guardar contactos",
};
const PROVIDERS = [
  { id: "chatgpt", name: "ChatGPT" },
  { id: "claude", name: "Claude" },
  { id: "grok", name: "Grok" },
  { id: "gemini", name: "Gemini" },
  { id: "other", name: "Otra IA" },
];

function connectionUrl(token: string) {
  return `${window.location.origin}/api/mcp/connect/${encodeURIComponent(token)}`;
}

export function McpConnectionsClient() {
  const [items, setItems] = useState<Conn[]>([]);
  const [provider, setProvider] = useState("chatgpt");
  const [scopes, setScopes] = useState<Scope[]>(ALL);
  const [url, setUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = () => fetch("/api/mcp/tokens")
    .then((response) => response.json())
    .then((data) => setItems(data.connections || []))
    .catch(() => {});

  useEffect(() => { load(); }, []);

  const toggle = (scope: Scope) => setScopes((current) => current.includes(scope)
    ? current.filter((item) => item !== scope)
    : [...current, scope]);

  async function copyConnection(token: string) {
    const nextUrl = connectionUrl(token);
    setUrl(nextUrl);
    try {
      await navigator.clipboard.writeText(nextUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  async function create() {
    setCreating(true);
    setUrl("");
    try {
      const selected = PROVIDERS.find((item) => item.id === provider);
      const response = await fetch("/api/mcp/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: selected?.name || "Mi IA", provider, scopes }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo crear la conexión");
      if (data.token) await copyConnection(data.token);
      load();
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo crear la conexión");
    } finally {
      setCreating(false);
    }
  }

  async function tokenAction(id: string, action: "reveal" | "rotate") {
    const response = await fetch("/api/mcp/tokens", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    const data = await response.json();
    if (data.token) await copyConnection(data.token);
    else if (data.error) alert(data.error);
    load();
  }

  async function revoke(id: string) {
    await fetch(`/api/mcp/tokens?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setUrl("");
    load();
  }

  return <div className="mcp-grid">
    <section className="mcp-hero va-crystal va-spatial">
      <div className="mcp-signal" aria-hidden><i/><i/><i/></div>
      <p className="eon-page-kicker">Eon Trust · MCP</p><h2>Tu memoria puede acompañarte entre IAs.</h2>
      <p>ChatGPT, Claude, Grok, Gemini o la IA que uses pueden consultar y guardar sólo lo que tú autorices. Cambias de modelo sin volver a empezar de cero.</p>
      <div className="mcp-principles"><span>Tu memoria es tuya</span><span>Acceso revocable</span><span>Contexto mínimo necesario</span></div>
    </section>

    <section className="mcp-card">
      <div className="mcp-step"><b>1</b><div><strong>Elige la IA</strong><small>Cada IA recibe su propia conexión segura.</small></div></div>
      <div className="mcp-provider-row">{PROVIDERS.map((item) => <button key={item.id} className={provider === item.id ? "active" : ""} onClick={() => setProvider(item.id)}>{item.name}</button>)}</div>
      <div className="mcp-step"><b>2</b><div><strong>Decide qué puede consultar y guardar</strong><small>Bóveda, secretos y borrado quedan fuera.</small></div></div>
      <div className="mcp-scope-grid">{ALL.map((scope) => <button key={scope} onClick={() => toggle(scope)} className={scopes.includes(scope) ? "active" : ""}><span>{scopes.includes(scope) ? "✓" : "○"}</span>{LABELS[scope]}</button>)}</div>
      <div className="mcp-step"><b>3</b><div><strong>Genera la conexión</strong><small>Recibirás una sola URL lista para pegar.</small></div></div>
      <button className="mcp-create" disabled={!scopes.length || creating} onClick={create}>{creating ? "Creando conexión…" : "Conectar esta IA"}</button>
      {url && <div className="mcp-token">
        <p>URL de conexión lista. Trátala como una llave privada.</p>
        <code>{url}</code>
        <button onClick={() => navigator.clipboard.writeText(url).then(() => setCopied(true))}>{copied ? "Copiada" : "Copiar URL de conexión"}</button>
      </div>}
    </section>

    <section className="mcp-card mcp-guide">
      <p className="eon-page-kicker">Eon te acompaña</p><h3>Conéctalo en un minuto</h3>
      <ol>
        <li>Genera la conexión para tu IA.</li>
        <li>Copia la URL completa que entrega Eternime.</li>
        <li>En ChatGPT pégala como servidor MCP y elige “Sin autenticación”.</li>
        <li>Escanea las herramientas y prueba: “Guarda esto en Eternime”.</li>
      </ol>
      <p className="mcp-note">En Claude, Gemini u otro cliente compatible, pega la misma URL en el campo de servidor MCP remoto. No agregues headers ni pegues una llave por separado. Ninguna IA conectada puede borrar contenido.</p>
    </section>

    <section className="mcp-card">
      <div className="flex items-center justify-between"><div><p className="eon-page-kicker">Accesos activos</p><h3>Mis IAs</h3></div><span className="mcp-count">{items.filter((item) => !item.revoked_at).length}</span></div>
      <div className="mcp-list">{items.length ? items.map((item) => <div className={`mcp-item ${item.revoked_at ? "revoked" : ""}`} key={item.id}>
        <div><strong>{item.label}</strong><small>{item.scopes.map((scope) => LABELS[scope]).join(", ")}</small><small>{item.last_used_at ? `Último uso: ${new Date(item.last_used_at).toLocaleString("es-MX")}` : "Todavía no se ha usado"}</small></div>
        {!item.revoked_at && <div className="flex gap-1"><button onClick={() => tokenAction(item.id, "reveal")}>Copiar URL</button><button onClick={() => tokenAction(item.id, "rotate")}>Rotar URL</button><button onClick={() => revoke(item.id)}>Revocar</button></div>}
      </div>) : <p className="mcp-empty">Aún no has conectado otra IA.</p>}</div>
    </section>
  </div>;
}
