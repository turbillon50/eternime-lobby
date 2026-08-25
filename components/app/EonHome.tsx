import Link from "next/link";
import { EonOrb } from "@/components/eon/EonOrb";
import { EonCompose } from "@/components/app/EonCompose";
import { ClarityIndex } from "@/components/app/ClarityIndex";
import { Greeting } from "@/components/app/Greeting";
import {
  IconTask, IconLetter, IconTimeline, IconMemory, IconNote, IconDoc, IconVoice,
} from "@/components/shell/icons";

/**
 * Inicio de Eternime.
 *
 * TODO lo que se ve aquí sale de registros reales del usuario. Si no hay dato
 * para una fila, la fila NO existe (nada de ejemplos ni placeholders).
 */

export type AttentionRow = {
  id: string;
  tone: "violet" | "amber";
  glyph: "task" | "letter" | "calendar";
  title: string;
  detail: string;
  href: string;
  cta: string;
};

export type TimelineRow = {
  id: string;
  day: string;
  time: string | null;
  kind: string;
  title: string;
  meta: string | null;
  tone: "violet" | "amber";
  glyph: "memory" | "letter" | "task" | "note" | "doc" | "voice";
  href: string;
};

const GLYPHS = {
  task: <IconTask size={19} />,
  letter: <IconLetter size={19} />,
  calendar: <IconTimeline size={19} />,
  memory: <IconMemory size={17} />,
  note: <IconNote size={17} />,
  doc: <IconDoc size={17} />,
  voice: <IconVoice size={17} />,
};

export function EonHome({
  firstName,
  attention,
  timeline,
}: {
  firstName?: string;
  attention: AttentionRow[];
  timeline: TimelineRow[];
}) {
  return (
    <div className="eon-home-layout">
      <div className="eon-home">
        <section className="eon-home-hero">
          <EonOrb size={168} label="EON, tu segunda memoria" />
          <Greeting name={firstName} />
          <p className="eon-greeting-sub">
            Pregunta, recuerda, crea o conecta ideas. Tú hablas; Eternime organiza el resto.
          </p>
        </section>

        {/* El compose es el punto natural de interacción con EON */}
        <EonCompose firstName={firstName} />

        <section aria-labelledby="atencion">
          <p className="eon-section-label" id="atencion">Esto necesita tu atención</p>
          {attention.length > 0 ? (
            <div className="eon-attention">
              {attention.map((row) => (
                <Link key={row.id} href={row.href} className="eon-row">
                  <span className="eon-row-glyph" data-tone={row.tone === "amber" ? "amber" : undefined} aria-hidden>
                    {GLYPHS[row.glyph]}
                  </span>
                  <span className="eon-row-body">
                    <b>{row.title}</b>
                    <p>{row.detail}</p>
                  </span>
                  <span className="eon-row-cta" data-tone={row.tone === "amber" ? "amber" : undefined}>
                    {row.cta}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="eon-empty">
              <b>Nada urgente por ahora.</b>
              Cuando tengas pendientes con fecha o cartas programadas, Eon los traerá aquí.{" "}
              <Link href="/app/pendientes">Crear un pendiente</Link>
            </div>
          )}
        </section>

        <div className="lg:hidden">
          <ClarityIndex />
        </div>
      </div>

      {/* Contexto lateral: sólo aparece cuando aporta valor */}
      <aside className="eon-rail">
        <div className="eon-rail-sticky">
          <div className="hidden lg:block mb-7">
            <ClarityIndex />
          </div>
          <h2>Timeline</h2>
          {timeline.length > 0 ? (
            <div className="eon-timeline">
              {timeline.map((ev, i) => {
                const prev = timeline[i - 1];
                return (
                  <div key={ev.id}>
                    {ev.day !== prev?.day && <p className="eon-tl-day">{ev.day}</p>}
                    <Link href={ev.href} className="eon-tl-item" data-tone={ev.tone === "amber" ? "amber" : undefined}>
                      <span className="eon-tl-glyph" aria-hidden>{GLYPHS[ev.glyph]}</span>
                      <span className="eon-tl-body">
                        <small>{ev.time ? `${ev.time} · ${ev.kind}` : ev.kind}</small>
                        <b>{ev.title}</b>
                        {ev.meta && <span>{ev.meta}</span>}
                      </span>
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="eon-empty">
              <b>Tu timeline empieza hoy.</b>
              Cada recuerdo, carta o pendiente que guardes aparecerá aquí en orden.{" "}
              <Link href="/app/recuerdos">Guardar el primero</Link>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
