"use client";

import Link from "next/link";
import { useReadiness } from "./useReadiness";

/**
 * Índice de claridad — el anillo del Inicio. Es exactamente el readiness
 * score que ya existía, con otra piel y en formato compacto.
 */
export function ClarityIndex() {
  const r = useReadiness();

  if (!r) {
    return (
      <div className="eon-clarity" aria-busy="true">
        <div className="eon-skeleton" style={{ width: 78, height: 78, borderRadius: "50%", flex: "0 0 78px" }} />
        <div className="grid gap-2 flex-1 min-w-0">
          <div className="eon-skeleton" style={{ height: 9, width: "52%" }} />
          <div className="eon-skeleton" style={{ height: 14, width: "72%" }} />
        </div>
      </div>
    );
  }

  return (
    <Link href="/app/perfil" className="eon-clarity" aria-label={`Índice de claridad: ${r.score} de 100. ${r.headline}`}>
      <div
        className="eon-clarity-ring"
        style={{ background: `conic-gradient(var(--eon-violet) ${r.score}%, rgba(139,92,255,.12) 0)` }}
      >
        <span className="eon-clarity-value" aria-hidden>{r.score}</span>
      </div>
      <div className="eon-clarity-meta">
        <small>Índice de claridad</small>
        <b>{r.headline}</b>
        <p>{r.done} de {r.items.length} cimientos listos</p>
      </div>
    </Link>
  );
}
