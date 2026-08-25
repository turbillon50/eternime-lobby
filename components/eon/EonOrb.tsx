"use client";

/**
 * EON — presencia viva. Arte craft 4K compuesto en capas:
 * dos copias del mismo arte en blend screen girando en sentidos
 * contrarios (flujo interno orgánico), respiración lenta, parallax
 * espacial sutil al puntero y luz ambiental que baña la interfaz.
 * Estados conectados a actividad real. Misma interfaz pública que
 * la versión WebGL a la que reemplaza.
 */

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { EonState } from "./eon-gl";
import { useEon } from "./eon-state";

type Props = {
  /** Lado en px. El orbe es cuadrado. */
  size?: number;
  /** Fuerza un estado; si se omite, usa el estado global real de EON. */
  state?: EonState;
  /** Reacción sutil al puntero (desactivar en orbes decorativos pequeños). */
  interactive?: boolean;
  className?: string;
  /** Etiqueta accesible; null = decorativo (aria-hidden). */
  label?: string | null;
};

type Visual = {
  breath: number; spin: number; bright: number; hue: number;
  sat: number; scale: number; ambient: number; amber: number;
};

/** Espejo del perfil por estado de la versión WebGL. */
const VISUALS: Record<EonState, Visual> = {
  idle:      { breath: 7,   spin: 200, bright: 1.0,  hue: 0,   sat: 1.0,  scale: 1.0,  ambient: 0.08, amber: 0.22 },
  listening: { breath: 4.5, spin: 150, bright: 1.14, hue: 0,   sat: 1.06, scale: 1.04, ambient: 0.13, amber: 0.34 },
  thinking:  { breath: 3.2, spin: 80,  bright: 1.06, hue: -16, sat: 1.12, scale: 0.99, ambient: 0.13, amber: 0.10 },
  acting:    { breath: 4,   spin: 60,  bright: 1.16, hue: 6,   sat: 1.15, scale: 1.02, ambient: 0.14, amber: 0.62 },
  success:   { breath: 5,   spin: 120, bright: 1.32, hue: 0,   sat: 1.10, scale: 1.05, ambient: 0.18, amber: 0.42 },
  error:     { breath: 9,   spin: 260, bright: 0.85, hue: 14,  sat: 0.90, scale: 0.94, ambient: 0.05, amber: 0.80 },
  offline:   { breath: 12,  spin: 420, bright: 0.45, hue: 0,   sat: 0.35, scale: 0.97, ambient: 0.03, amber: 0.05 },
};

export function EonOrb({
  size = 120,
  state,
  interactive = true,
  className = "",
  label = null,
}: Props) {
  const holder = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const [inView, setInView] = useState(true);
  const [pxy, setPxy] = useState({ x: 0, y: 0 });
  const eon = useEon();
  const active: EonState = state ?? eon.state;
  const v = VISUALS[active] ?? VISUALS.idle;

  /* Pausa total fuera del viewport: cero trabajo invisible. */
  useEffect(() => {
    const el = holder.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting),
      { rootMargin: "80px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* Micro-sensación espacial: el orbe se inclina apenas hacia el puntero. */
  useEffect(() => {
    if (!interactive) return;
    const el = holder.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
        setPxy({
          x: Math.max(-1, Math.min(1, nx)) * 3,
          y: Math.max(-1, Math.min(1, ny)) * 3,
        });
      });
    };
    const leave = () => setPxy({ x: 0, y: 0 });
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf.current);
    };
  }, [interactive]);

  /* Escuchar de verdad: el nivel de audio real aviva la luz. */
  const audioBoost = active === "listening" ? eon.audio * 0.2 : 0;
  const src = size <= 340 ? "/eon/orb-a-1024.webp" : "/eon/orb-a.webp";

  const style = useMemo(
    () =>
      ({
        width: size,
        height: size,
        "--o2-breath": `${v.breath}s`,
        "--o2-spin": `${v.spin}s`,
        "--o2-bright": String(v.bright + audioBoost),
        "--o2-hue": `${v.hue}deg`,
        "--o2-sat": String(v.sat),
        "--o2-scale": String(v.scale),
        "--o2-ambient": String(v.ambient),
        "--o2-amber": String(v.amber),
        "--o2-px": `${pxy.x}px`,
        "--o2-py": `${pxy.y}px`,
      }) as CSSProperties,
    [size, v, audioBoost, pxy],
  );

  return (
    <div
      ref={holder}
      className={`eon-orb2 ${className}`}
      data-state={active}
      data-paused={inView ? undefined : ""}
      style={style}
      role={label ? "img" : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
    >
      <span className="eon-orb2-ambient" aria-hidden />
      <span className="eon-orb2-stack">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="eon-orb2-base" src={src} alt="" draggable={false} loading="lazy" decoding="async" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="eon-orb2-flow" src={src} alt="" draggable={false} loading="lazy" decoding="async" aria-hidden />
      </span>
    </div>
  );
}
