"use client";

/**
 * Cálculo de preparación de Eon. Es la MISMA fuente que ya alimentaba el
 * readiness score; se extrajo a un hook para que el "Índice de claridad" del
 * Inicio y la tarjeta detallada no dupliquen lógica ni peticiones distintas.
 * Todo sale de endpoints reales: cero datos inventados.
 */

import { useEffect, useState } from "react";

export type ReadinessItem = {
  key: string;
  label: string;
  href: string;
  ok: boolean;
  detail: string;
};

export type Readiness = {
  items: ReadinessItem[];
  score: number;
  done: number;
  /** Lectura humana del índice. */
  headline: string;
};

const ENDPOINTS = [
  "/api/memories",
  "/api/network",
  "/api/projects",
  "/api/mcp/tokens",
  "/api/voice/clone",
  "/api/identity",
] as const;

type Conn = { revoked_at?: string | null };

export function useReadiness(): Readiness | null {
  const [data, setData] = useState<Readiness | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all(
      ENDPOINTS.map((u) => fetch(u).then((r) => r.json()).catch(() => ({}))),
    ).then(([m, n, p, i, v, a]) => {
      if (!alive) return;
      const conns: Conn[] = i.connections || [];
      const live = conns.filter((x) => !x.revoked_at);
      const items: ReadinessItem[] = [
        { key: "memory",  label: "Memoria",          href: "/app/recuerdos", ok: (m.memories || []).length > 0, detail: `${(m.memories || []).length} recuerdos` },
        { key: "network", label: "Mi Red",           href: "/app/red",       ok: (n.people || []).length > 0,   detail: `${(n.people || []).length} personas` },
        { key: "projects",label: "Proyectos",        href: "/app/proyectos", ok: (p.projects || []).length > 0, detail: `${(p.projects || []).length} activos` },
        { key: "mcp",     label: "Mis IAs",          href: "/app/ias",       ok: live.length > 0,               detail: `${live.length} conectadas` },
        { key: "voice",   label: "Tu voz",           href: "/app/perfil",    ok: Boolean(v.voiceId),            detail: v.voiceId ? "Clon activo" : "Pendiente" },
        { key: "visual",  label: "Identidad visual", href: "/app/perfil",    ok: (a.assets || []).length >= 6,  detail: `${(a.assets || []).length}/6 capturas` },
      ];
      const done = items.filter((x) => x.ok).length;
      const score = Math.round((done / items.length) * 100);
      setData({
        items, done, score,
        headline:
          score >= 85 ? "Tu Eon ya tiene una base fuerte."
          : score >= 50 ? "Bien encaminado."
          : "Construyamos tu base personal.",
      });
    });
    return () => { alive = false; };
  }, []);

  return data;
}
