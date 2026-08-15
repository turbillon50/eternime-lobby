"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export type Segmento = {
  key: string;
  /** Etiqueta corta bajo el segmento */
  label: string;
  /** Hito cumplido → encendido */
  done: boolean;
  /** A dónde lleva tocar el segmento apagado (o ver el encendido) */
  href: string;
  /** Cifra real, solo se muestra si el segmento está encendido y tiene conteo */
  count?: number;
};

/* ── Geometría del anillo ── */
const VB = 240; // viewBox
const C = VB / 2; // centro
const R = 92; // radio del anillo
const GAP = 9; // grados de separación entre segmentos
const N = 5;
const SEG = 360 / N; // 72°

function pt(angleDeg: number, radius = R) {
  const a = ((angleDeg - 90) * Math.PI) / 180; // 0° arriba
  return { x: C + radius * Math.cos(a), y: C + radius * Math.sin(a) };
}

function arcPath(index: number) {
  const start = index * SEG + GAP / 2;
  const end = index * SEG + SEG - GAP / 2;
  const a = pt(start);
  const b = pt(end);
  const largeArc = end - start > 180 ? 1 : 0;
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${R} ${R} 0 ${largeArc} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

function midAngle(index: number) {
  return index * SEG + SEG / 2;
}

export function AnilloLegado({ segmentos }: { segmentos: Segmento[] }) {
  const encendidos = segmentos.filter((s) => s.done).length;

  return (
    <div className="mx-auto w-full max-w-[20rem]">
      <div className="relative aspect-square w-full">
        <svg viewBox={`0 0 ${VB} ${VB}`} className="h-full w-full" aria-hidden>
          <defs>
            <filter id="anillo-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Pistas base (apagadas) */}
          {segmentos.map((s, i) => (
            <path
              key={`track-${s.key}`}
              d={arcPath(i)}
              fill="none"
              stroke="var(--et-border)"
              strokeWidth={6}
              strokeLinecap="round"
            />
          ))}

          {/* Segmentos encendidos */}
          {segmentos.map((s, i) =>
            s.done ? (
              <motion.path
                key={`lit-${s.key}`}
                d={arcPath(i)}
                fill="none"
                stroke="var(--et-gold)"
                strokeWidth={6}
                strokeLinecap="round"
                filter="url(#anillo-glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              />
            ) : null
          )}

          {/* Punto central que late suave */}
          <motion.circle
            cx={C}
            cy={C}
            r={7}
            fill="var(--et-gold-bright)"
            filter="url(#anillo-glow)"
            animate={{ opacity: [0.55, 1, 0.55], scale: [1, 1.14, 1] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: `${C}px ${C}px` }}
          />
          <text
            x={C}
            y={C + 34}
            textAnchor="middle"
            fontSize="12"
            letterSpacing="1.5"
            fill="var(--et-text-faint)"
          >
            {encendidos}/{N}
          </text>
        </svg>

        {/* Nodos tocables sobre cada segmento */}
        {segmentos.map((s, i) => {
          const p = pt(midAngle(i), R);
          const left = (p.x / VB) * 100;
          const top = (p.y / VB) * 100;
          const inner = (
            <span className="flex flex-col items-center gap-1 text-center">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-[0.62rem] font-medium transition ${
                  s.done
                    ? "border-[var(--et-gold)] bg-[rgba(201,169,97,0.14)] text-[var(--et-gold-bright)] shadow-[var(--et-glow)]"
                    : "border-[var(--et-border)] bg-[var(--et-bg-elevated)] text-[var(--et-text-faint)]"
                }`}
              >
                {s.done ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l4.5 4.5L19 7" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                )}
              </span>
              <span
                className={`whitespace-nowrap text-[0.58rem] leading-none ${
                  s.done ? "text-[var(--et-gold)]" : "text-[var(--et-text-faint)]"
                }`}
              >
                {s.label}
              </span>
              {s.done && typeof s.count === "number" ? (
                <span className="text-[0.62rem] font-medium leading-none text-[var(--et-gold-bright)]">{s.count}</span>
              ) : null}
            </span>
          );
          return (
            <Link
              key={s.key}
              href={s.href}
              aria-label={s.done ? `${s.label} — completado` : `${s.label} — pendiente, toca para empezar`}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--et-gold-dim)]"
              style={{ left: `${left}%`, top: `${top}%` }}
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
