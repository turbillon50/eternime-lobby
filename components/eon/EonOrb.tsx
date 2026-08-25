"use client";

/**
 * EON — componente de presencia, reutilizable y controlable por estado.
 *
 * Rendimiento: lazy-load del render avanzado (sólo monta WebGL cuando entra
 * en viewport), pausa fuera de viewport y con pestaña oculta, DPR limitado,
 * menos capas en equipos modestos. Accesibilidad: representación semántica
 * simple; la animación no genera ruido para lectores de pantalla.
 */

import { useEffect, useRef, useState } from "react";
import { EonRenderer, type EonState } from "./eon-gl";
import { useEon } from "./eon-state";

type Props = {
  /** Lado en px. El canvas es cuadrado. */
  size?: number;
  /** Fuerza un estado; si se omite, usa el estado global real de EON. */
  state?: EonState;
  /** Reacción sutil al cursor (desactivar en orbes decorativos pequeños). */
  interactive?: boolean;
  className?: string;
  /** Etiqueta accesible; null = decorativo (aria-hidden). */
  label?: string | null;
};

/** Heurística barata de capacidad del equipo. */
function pickQuality(size: number): number {
  if (typeof navigator === "undefined") return 1;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency ?? 4;
  const small = size <= 64;
  if (small) return 0.5;
  if (mem <= 2 || cores <= 2) return 0.5;
  if (mem <= 4 || cores <= 4) return 0.7;
  return 1;
}

export function EonOrb({
  size = 120,
  state,
  interactive = true,
  className = "",
  label = null,
}: Props) {
  const holder = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<EonRenderer | null>(null);
  const [gl, setGl] = useState(false);
  const [visible, setVisible] = useState(false);
  const eon = useEon();
  const active: EonState = state ?? eon.state;

  // Sólo monta el canvas cuando el orbe está realmente a la vista
  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const io = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { rootMargin: "120px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced =
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;

    const r = new EonRenderer(canvas, { quality: pickQuality(size) });
    if (!r.init()) { setGl(false); return; }
    renderer.current = r;
    setGl(true);
    r.setState(active);

    if (reduced) {
      // Versión estática elegante: sin RAF, sólo un frame.
      r.renderStatic();
    } else {
      r.start();
    }

    const ro = new ResizeObserver(() => {
      r.resize();
      if (reduced) r.renderStatic();
    });
    ro.observe(canvas);

    const onVis = () => {
      if (reduced) return;
      if (document.hidden) r.stop(); else r.start();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      ro.disconnect();
      r.dispose();
      renderer.current = null;
    };
    // `active` se propaga en el efecto de abajo; aquí sólo monta/desmonta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, size]);

  // Pausa cuando sale del viewport (rendimiento)
  useEffect(() => {
    const r = renderer.current;
    if (!r) return;
    const reduced =
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    if (visible && !document.hidden) r.start(); else r.stop();
  }, [visible]);

  // Estado -> shader
  useEffect(() => {
    const r = renderer.current;
    if (!r) return;
    r.setState(active);
    const reduced =
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    // En reduced-motion el cambio de estado se ve por iluminación, no por movimiento
    if (reduced) r.renderStatic();
  }, [active]);

  // Nivel de audio real
  useEffect(() => {
    renderer.current?.setAudio(eon.audio);
  }, [eon.audio]);

  // Reacción sutil al cursor / touch
  useEffect(() => {
    if (!interactive || !gl) return;
    const el = holder.current;
    if (!el) return;
    const move = (cx: number, cy: number) => {
      const b = el.getBoundingClientRect();
      renderer.current?.setPointer(
        ((cx - b.left) / b.width) * 2 - 1,
        -(((cy - b.top) / b.height) * 2 - 1),
      );
    };
    const onMouse = (e: MouseEvent) => move(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) move(t.clientX, t.clientY);
    };
    const reset = () => renderer.current?.setPointer(0, 0);
    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("mouseleave", reset);
    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("mouseleave", reset);
    };
  }, [interactive, gl]);

  const a11y = label
    ? { role: "img" as const, "aria-label": label }
    : { "aria-hidden": true as const };

  return (
    <div
      ref={holder}
      className={`eon-orb ${className}`}
      style={{ width: size, height: size }}
      data-state={active}
      {...a11y}
    >
      <span className="eon-orb-halo" aria-hidden />
      {/* Fallback estable: se ve siempre debajo; el canvas lo cubre si hay WebGL */}
      {!gl && <span className="eon-orb-fallback" aria-hidden />}
      {visible && <canvas ref={canvasRef} width={size} height={size} />}
    </div>
  );
}
