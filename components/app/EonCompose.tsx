"use client";

/**
 * Compose de EON — punto natural de interacción.
 *
 * Sólo expone acciones REALES: enviar, detener la generación en curso,
 * reintentar tras error, ir a voz (/app/hablar), guardar un recuerdo
 * (/app/recuerdos) y los atajos que el backend sí ejecuta
 * (executeDirectAction en /api/guide-messages). No hay adjuntos ni cámara
 * porque el endpoint del chat no los acepta: no se dibujan botones muertos.
 */

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { GuideMessage } from "@/lib/data/types";
import { LivingMesh } from "@/components/visual/VisualArtifacts";
import { useEon } from "@/components/eon/eon-state";
import { IconArrow, IconPlus, IconVoice, IconStop, IconSpark } from "@/components/shell/icons";

type Citation = { id: string; title: string };
type ApiResponse = {
  messages?: GuideMessage[]; reply?: string; error?: string;
  cited?: Citation[]; assistantMessage?: GuideMessage | null;
};

/** Atajos que el backend ejecuta de verdad. */
const QUICK = [
  { label: "¿Qué tengo pendiente?", text: "¿Qué tengo pendiente?" },
  { label: "Crear proyecto", text: "Crea un proyecto llamado " },
  { label: "Crear pendiente", text: "Recuérdame " },
  { label: "Busca en mi memoria", text: "Busca en mi memoria algo importante que haya olvidado" },
  { label: "¿A quién conozco?", text: "¿Qué personas de mi red podrían ayudarme hoy?" },
];

export function EonCompose({ firstName = "" }: { firstName?: string }) {
  const [messages, setMessages] = useState<GuideMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [sent, setSent] = useState(false);
  const [citations, setCitations] = useState<Record<string, Citation[]>>({});

  const endRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastSent = useRef<string>("");
  const eon = useEon();

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  useEffect(() => {
    fetch("/api/guide-messages")
      .then(async (r) => ({ ok: r.ok, data: (await r.json()) as ApiResponse }))
      .then(({ ok, data }) => { if (ok) setMessages(data.messages ?? []); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Auto-scroll SÓLO tras un envío propio y sólo si el usuario ya está cerca
  // del final. Al cargar no se arrastra la página: si estás leyendo arriba,
  // te quedas arriba.
  useEffect(() => {
    if (!sent) return;
    const el = threadRef.current;
    if (!el) return;
    const doc = document.scrollingElement || document.documentElement;
    const near = doc.scrollHeight - doc.scrollTop - doc.clientHeight < 260;
    if (near || loading) endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading, sent]);

  // Altura autoexpandible hasta un máximo razonable; después scroll interno.
  const autosize = useCallback(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, []);
  useEffect(autosize, [text, autosize]);

  function stop() {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
    eon.setState("idle");
  }

  const post = useCallback(
    async (content: string) => {
      setLoading(true);
      setFailed(null);
      eon.setState("thinking");
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch("/api/guide-messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
          signal: ctrl.signal,
        });
        const data = (await res.json()) as ApiResponse;
        if (!res.ok) throw new Error(data.error || "No pude responder");
        const reply = data.reply || "Estoy aquí.";
        const id = data.assistantMessage?.id || `eon-${Date.now()}`;
        setMessages((m) => [
          ...m,
          { id, user_id: "eon", role: "assistant", content: reply, created_at: new Date().toISOString() },
        ]);
        if (data.cited?.length) setCitations((c) => ({ ...c, [id]: data.cited! }));
        eon.pulse("success", 1100);
      } catch (e) {
        if ((e as Error)?.name === "AbortError") return;
        setFailed(content);
        eon.pulse("error", 1800);
      } finally {
        abortRef.current = null;
        setLoading(false);
      }
    },
    [eon],
  );

  async function send(e: FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || loading) return;
    setText("");
    setSent(true);
    lastSent.current = content;
    setMessages((m) => [
      ...m,
      { id: `local-${Date.now()}`, user_id: "me", role: "user", content, created_at: new Date().toISOString() },
    ]);
    await post(content);
  }

  const hasChat = loaded && messages.length > 0;
  const placeholder = hasChat
    ? "Sigue la conversación con Eon…"
    : `Pregúntale a tu memoria${firstName ? `, ${firstName}` : ""}…`;

  // Inicio es compose-first: muestra el último intercambio, no el hilo entero.
  // La conversación completa vive donde siempre vivió: /app/guia.
  const recent = messages.slice(sent ? -4 : -2);

  return (
    <div className={`eon-chat ${hasChat ? "has-chat" : ""}`}>
      {(hasChat || loading || failed) && (
        <section className="eon-thread eon-thread-preview" ref={threadRef} aria-live="polite" aria-label="Conversación con Eon">
          {recent.map((m) => (
            <div key={m.id} className={`eon-message ${m.role}`}>
              <div>{m.content}</div>
              {citations[m.id]?.length ? (
                <div className="eon-citations">
                  <span>Memoria consultada</span>
                  {citations[m.id].slice(0, 3).map((c) => (
                    <Link key={c.id} href={`/app/recuerdos?memory=${encodeURIComponent(c.id)}`}>
                      {c.title}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {loading && (
            <div className="eon-message assistant">
              <div className="eon-thinking">
                <i /><i /><i />
                <span>Eon está pensando</span>
              </div>
            </div>
          )}
          {failed && (
            <div className="eon-message assistant">
              <div>
                No pude responder. Tu mensaje no se perdió.
                <button type="button" className="eon-retry" onClick={() => post(failed)}>
                  Reintentar
                </button>
              </div>
            </div>
          )}
          {hasChat && (
            <Link href="/app/guia" className="eon-thread-more">
              Ver conversación completa
              <IconArrow size={15} />
            </Link>
          )}
          <div ref={endRef} />
        </section>
      )}

      <form className="eon-compose-card eon-compose-real va-crystal" onSubmit={send}>
        <LivingMesh />
        <div className="eon-compose-row">
          <span className="compose-action" aria-hidden><IconSpark size={18} /></span>
          <textarea
            ref={areaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            placeholder={placeholder}
            aria-label="Escribe tu mensaje para Eon"
            enterKeyHint="send"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
        </div>

        <div className="eon-compose-foot">
          <div className="eon-compose-tools">
            <Link href="/app/recuerdos" className="compose-action" aria-label="Guardar un recuerdo">
              <IconPlus size={18} />
            </Link>
            <Link href="/app/hablar" className="compose-action" aria-label="Hablar con Eon por voz">
              <IconVoice size={18} />
            </Link>
            <span className="eon-pill hidden sm:inline-flex" data-tone={online ? undefined : "offline"}>
              <i />
              {online ? "Memoria activa" : "Sin conexión"}
            </span>
          </div>

          {loading ? (
            <button type="button" onClick={stop} className="eon-send-btn" data-mode="stop" aria-label="Detener la respuesta">
              <IconStop size={17} />
            </button>
          ) : (
            <button type="submit" disabled={!text.trim() || !online} className="eon-send-btn" aria-label="Enviar mensaje">
              <IconArrow size={18} />
            </button>
          )}
        </div>
      </form>

      {!hasChat && (
        <div className="eon-suggestions">
          {QUICK.map((q) => (
            <button key={q.label} type="button" onClick={() => { setText(q.text); areaRef.current?.focus(); }}>
              {q.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
