"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { GuideMessage } from "@/lib/data/types";
import { EonOrb, LivingMesh, LightSweep } from "@/components/visual/VisualArtifacts";

type Citation = { id: string; title: string };
type ApiResponse = { messages?: GuideMessage[]; reply?: string; error?: string; cited?: Citation[]; assistantMessage?: GuideMessage | null };

export function EonCompose({ firstName = "" }: { firstName?: string }) {
  const [messages, setMessages] = useState<GuideMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const followRef = useRef(true);
  const [citations, setCitations] = useState<Record<string, Citation[]>>({});

  useEffect(() => {
    fetch("/api/guide-messages").then(async r => ({ ok:r.ok, data: await r.json() as ApiResponse })).then(({ok,data}) => {
      if (ok) setMessages(data.messages ?? []);
    }).catch(()=>{}).finally(()=>setLoaded(true));
  }, []);
  useEffect(() => {
    if (!followRef.current) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    endRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block:"nearest" });
  }, [messages, loading]);
  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => { const el=areaRef.current; if(!el) return; el.style.height="auto"; el.style.height=String(Math.min(el.scrollHeight,180))+"px"; }, [text]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || loading) return;
    setText("");
    setLoading(true);
    setError("");
    followRef.current = true;
    const controller = new AbortController();
    abortRef.current = controller;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(8);
    const optimistic: GuideMessage = { id:`local-${Date.now()}`, user_id:"me", role:"user", content, created_at:new Date().toISOString() };
    setMessages(m => [...m, optimistic]);
    try {
      const res = await fetch("/api/guide-messages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({content}), signal:controller.signal });
      const data = await res.json() as ApiResponse;
      if (!res.ok) throw new Error(data.error || "No pude responder");
      const reply = data.reply || "Estoy aquí.";
      const id = data.assistantMessage?.id || ("eon-" + Date.now());
      setMessages(m => [...m, { id, user_id:"eon", role:"assistant", content:reply, created_at:new Date().toISOString() }]);
      if (data.cited?.length) setCitations(c => ({ ...c, [id]: data.cited! }));
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setError("No pude completar la respuesta. Puedes intentarlo otra vez.");
    } finally { abortRef.current = null; setLoading(false); }
  }

  function stop() {
    abortRef.current?.abort();
    setLoading(false);
  }

  const hasChat = loaded && messages.length > 0;
  return <div className={`eon-chat va-crystal ${hasChat ? "has-chat" : ""}`} data-eon-state={loading ? "thinking" : error ? "error" : "idle"}><LivingMesh/><LightSweep/>
    {!hasChat && <section className="eon-welcome">
      <EonOrb state={loading ? "thinking" : error ? "error" : "idle"} />
      <p className="eon-kicker"><i /> EON está presente</p>
      <h1>¿En qué puedo ayudarte{firstName ? `, ${firstName}` : ""}?</h1>
      <p className="eon-sub">Tu memoria, tus proyectos y tus personas, unidos en una sola conversación.</p>
    </section>}

    {hasChat && <section className="eon-thread" aria-live="polite" onScroll={event => { const node = event.currentTarget; followRef.current = node.scrollHeight - node.scrollTop - node.clientHeight < 96; }}>
      {messages.slice(-18).map(m => <div key={m.id} className={`eon-message ${m.role}`}><div>{m.content}</div>{citations[m.id]?.length ? <div className="eon-citations"><span>Memoria consultada</span>{citations[m.id].slice(0,3).map(c=><Link key={c.id} href={`/app/recuerdos?memory=${encodeURIComponent(c.id)}`}>{c.title}</Link>)}</div> : null}</div>)}
      {loading && <div className="eon-message assistant"><div className="eon-thinking"><i/><i/><i/><span>Eon está pensando</span></div></div>}
      {error && <div className="eon-inline-error" role="alert"><span>{error}</span><button type="button" onClick={()=>setError("")}>Cerrar</button></div>}
      <div ref={endRef}/>
    </section>}

    <form className="eon-compose-card eon-compose-real" onSubmit={send}>
      <textarea ref={areaRef} value={text} onChange={e=>setText(e.target.value)} rows={1} placeholder="Pregúntale lo que quieras a Eon…" onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();e.currentTarget.form?.requestSubmit();}}}/>
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2"><Link href="/app/boveda" className="compose-action" aria-label="Adjuntar desde la bóveda"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 5v14M5 12h14"/></svg></Link><span className="hidden sm:inline-flex eon-pill"><i/> Memoria activa</span></div>
        <div className="flex items-center gap-2"><Link href="/app/hablar" className="compose-action" aria-label="Conversación por voz"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3ZM5 11a7 7 0 0 0 14 0M12 18v3"/></svg></Link>{loading ? <button type="button" onClick={stop} className="eon-send-btn is-stop" aria-label="Detener respuesta"><span/></button> : <button type="submit" disabled={!text.trim()} className="eon-send-btn" aria-label="Enviar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>}</div>
      </div>
    </form>

    {!hasChat && <div className="eon-suggestions"><button onClick={()=>setText("¿Qué tengo pendiente?")}>¿Qué tengo pendiente?</button><button onClick={()=>setText("Crea un proyecto llamado ")}>Crear proyecto</button><button onClick={()=>setText("Recuérdame ")}>Crear pendiente</button><button onClick={()=>setText("Busca en mi memoria algo importante que haya olvidado")}>Busca en mi memoria</button><button onClick={()=>setText("¿Qué personas de mi red podrían ayudarme hoy?")}>¿A quién conozco?</button></div>}
  </div>;
}
