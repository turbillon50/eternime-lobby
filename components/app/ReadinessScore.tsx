"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = { key: string; label: string; href: string; ok: boolean; detail: string };

export function ReadinessScore({ memoryCount }: { memoryCount: number }) {
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/network", { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
      fetch("/api/projects", { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
      fetch("/api/mcp/tokens", { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
      fetch("/api/voice/clone", { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
      fetch("/api/identity", { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
    ]).then(([network, projects, ias, voice, identity]) => setItems([
      { key: "memory", label: "Memoria", href: "/app/recuerdos", ok: memoryCount > 0, detail: `${memoryCount} recuerdos` },
      { key: "network", label: "Mi Red", href: "/app/red", ok: (network.people || []).length > 0, detail: `${(network.people || []).length} personas` },
      { key: "projects", label: "Proyectos", href: "/app/proyectos", ok: (projects.projects || []).length > 0, detail: `${(projects.projects || []).length} activos` },
      { key: "mcp", label: "Mis IAs", href: "/app/ias", ok: (ias.connections || []).some((x: { revoked_at?: string | null }) => !x.revoked_at), detail: `${(ias.connections || []).filter((x: { revoked_at?: string | null }) => !x.revoked_at).length} conectadas` },
      { key: "voice", label: "Tu voz", href: "/app/perfil", ok: Boolean(voice.voiceId), detail: voice.voiceId ? "Clon activo" : "Pendiente" },
      { key: "visual", label: "Identidad visual", href: "/app/perfil", ok: (identity.assets || []).length >= 6, detail: `${(identity.assets || []).length}/6 capturas` },
    ]));
  }, [memoryCount]);

  if (!items) return <section className="network-panel">Calculando preparación…</section>;
  const done = items.filter((item) => item.ok).length;
  const score = Math.round((done / items.length) * 100);

  return (
    <section className="readiness-card">
      <div className="readiness-score">
        <div className="readiness-ring" style={{ background: `conic-gradient(#7469ff ${score}%,rgba(116,105,255,.1) 0)` }}><span>{score}%</span></div>
        <div><p className="eon-page-kicker">Eternime Readiness</p><h3>{score >= 85 ? "Tu Eon ya tiene una base fuerte." : score >= 50 ? "Eon ya te está conociendo." : "Construyamos tu base personal."}</h3><p>Completa identidad, memoria y conexiones para que Eon pueda ayudarte con más contexto.</p></div>
      </div>
      <div className="readiness-grid">
        {items.map((item) => <Link key={item.key} href={item.href} className={item.ok ? "done" : ""}><span>{item.ok ? "✓" : "○"}</span><div><b>{item.label}</b><small>{item.detail}</small></div><i>→</i></Link>)}
      </div>
    </section>
  );
}
