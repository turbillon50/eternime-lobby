"use client";

import Link from "next/link";
import { useReadiness } from "./useReadiness";

/** Tarjeta detallada de preparación. Mismos datos reales de siempre. */
export function ReadinessScore() {
  const r = useReadiness();

  if (!r) {
    return (
      <section className="readiness-card" aria-busy="true">
        <div className="readiness-score">
          <div className="eon-skeleton" style={{ width: 86, height: 86, borderRadius: "50%", flex: "0 0 86px" }} />
          <div className="grid gap-2 flex-1">
            <div className="eon-skeleton" style={{ height: 10, width: "38%" }} />
            <div className="eon-skeleton" style={{ height: 18, width: "62%" }} />
            <div className="eon-skeleton" style={{ height: 10, width: "84%" }} />
          </div>
        </div>
        <div className="readiness-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="eon-skeleton" style={{ height: 44 }} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="readiness-card" aria-label="Preparación de tu Eon">
      <div className="readiness-score">
        <div
          className="readiness-ring"
          style={{ background: `conic-gradient(var(--eon-violet) ${r.score}%, rgba(139,92,255,.12) 0)` }}
          role="meter"
          aria-valuenow={r.score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Preparación: ${r.score} por ciento`}
        >
          <span>{r.score}%</span>
        </div>
        <div>
          <p className="eon-page-kicker">Eternime Readiness</p>
          <h3>{r.headline}</h3>
          <p>Completa identidad, memoria y conexiones para que Eon pueda ayudarte con más contexto.</p>
        </div>
      </div>
      <div className="readiness-grid">
        {r.items.map((x) => (
          <Link key={x.key} href={x.href} className={x.ok ? "done" : ""}>
            <span aria-hidden>{x.ok ? "✓" : "○"}</span>
            <div>
              <b>{x.label}</b>
              <small>{x.detail}</small>
            </div>
            <i aria-hidden>→</i>
          </Link>
        ))}
      </div>
    </section>
  );
}
