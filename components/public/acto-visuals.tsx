"use client";

/**
 * Visuales de los cuatro actos — EON, el personaje real, en el
 * estado que cuenta cada acto. Nada de diagramas ni aros: la
 * misma presencia craft que vive dentro de la app, con sus
 * micro-sensaciones (respiración, flujo interno, parallax).
 */

import { EonOrb } from "@/components/eon/EonOrb";
import type { EonState } from "@/components/eon/eon-gl";

function ActoCard({ state }: { state: EonState }) {
  return (
    <div className="et-acto-visual">
      <EonOrb size={236} state={state} interactive label={null} />
    </div>
  );
}

/** Acto 1 — Cuenta tu historia: EON escucha. */
export function VisualHistoria() {
  return <ActoCard state="listening" />;
}

/** Acto 2 — Tu guía aprende de ti: EON piensa. */
export function VisualGuia() {
  return <ActoCard state="thinking" />;
}

/** Acto 3 — Cartas al futuro: EON actúa. */
export function VisualCartas() {
  return <ActoCard state="acting" />;
}

/** Acto 4 — Trasciende: EON en plenitud. */
export function VisualTrasciende() {
  return <ActoCard state="success" />;
}

const CSS = [
  ".et-acto-visual { width: 100%; max-width: 320px; aspect-ratio: 1; margin-inline: auto; border-radius: var(--et-radius); border: 1px solid var(--et-border-soft); background: var(--et-bg-elevated); box-shadow: var(--et-glow); display: grid; place-items: center; overflow: hidden; }",
].join("\n");

export function ActoVisualStyles() {
  return <style dangerouslySetInnerHTML={{ __html: CSS }} />;
}
