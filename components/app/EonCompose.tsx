"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { GuideMessage } from "@/lib/data/types";

type Citation = { id: string; title: string };
type ApiResponse = { messages?: GuideMessage[]; reply?: string; error?: string; cited?: Citation[]; assistantMessage?: GuideMessage | null };

export function EonCompose({ firstName = "" }: { firstName?: string }) {
  const [messages, setMessages] = useState<GuideMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [citations, setCitations] = useState<Record<string, Citation[]>>({});

  useEffect(() => {
    fetch("/api/guide-messages").then(async r => ({ ok:r.ok, data: await r.json() as ApiResponse })).then(({ok,data}) => {
      if (ok) setMessages(data.messages ?? []);
    }).catch(()=>{}).finally(()=>setLoaded(true));
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth", block:"nearest" }); }, [messages, loading]);
  useEffect(() => { const el=areaRef.current; if(!el) return; el.style.height="auto"; el.style.height=String(Math.min(el.scrollHeight,180))+"px"; }, [text]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || loading) return;
    setText("");
    setLoading(true);
    const optimistic: GuideMessage = { id:`local-${Date.now()}`, user_id:"me", role:"user", content, created_at:new Date().toISOString() };
    setMessages(m => [...m, optimistic]);
    try {
      const res = await fetch("/api/guide-messages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({content}) });
      const data = await res.json() as ApiResponse;
      if (!res.ok) throw new Error(data.error || "No pude responder");
      const reply = data.reply || "Estoy aquí.";
      const id = data.assistantMessage?.id || ("eon-" + Date.now());
      setMessages(m => [...m, { id, user_id:"eon", role:"assistant", content:reply, created_at:new Date().toISOString() }]);
      if (data.cited?.length) setCitations(c => ({ ...c, [id]: data.cited! }));
    } catch {
      setMessages(m => [...m, { id:`err-${Date.now()}`, user_id:"eon", role:"assistant", content:"Tuve un problema al responder. Inténtalo de nuevo en un momento.", created_at:new Date().toISOString() }]);
    } finally { setLoading(false); }
  }

  const hasChat = loaded && messages.length > 0;
  if (!loaded) return <div className="eon-chat eon-chat-boot" aria-busy="true"><section className="eon-welcome"><div className="eon-presence eon-presence-skeleton" aria-hidden><span/><span/><span/></div><div className="craft-skeleton craft-skeleton-kicker"/><div className="craft-skeleton craft-skeleton-title"/><div className="craft-skeleton craft-skeleton-sub"/></section><div className="eon-compose-card craft-compose-skeleton"><div className="craft-skeleton craft-skeleton-line"/><div className="flex justify-between"><i/><i/></div></div></div>;
  return <div className={`eon-chat ${hasChat ? "has-chat" : ""}`}>
    {!hasChat && <section className="eon-welcome">
      <div className="eon-presence" aria-hidden><span/><span/><span/></div>
      <p className="eon-kicker">Eon está aquí</p>
      <h1>¿En qué puedo ayudarte{firstName ? `, ${firstName}` : ""}?</h1>
      <p className="eon-sub">Pregunta, recuerda, crea o conecta ideas. Tú hablas; Eternime organiza el resto.</p>
    </section>}

    {hasChat && <section className="eon-thread" aria-live="polite">
      {messages.slice(-18).map(m => <div key={m.id} className={`eon-message ${m.role}`}><div>{m.content}</div>{citations[m.id]?.length ? <div className="eon-citations"><span>Memoria consultada</span>{citations[m.id].slice(0,3).map(c=><Link key={c.id} href={`/app/recuerdos?memory=${encodeURIComponent(c.id)}`}>{c.title}</Link>)}</div> : null}</div>)}
      {loading && <div className="eon-message assistant"><div className="eon-thinking"><i/><i/><i/><span>Eon está pensando</span></div></div>}
      <div ref={endRef}/>
    </section>}

    <form className="eon-compose-card eon-compose-real" onSubmit={send}>
      <textarea ref={areaRef} value={text} onChange={e=>setText(e.target.value)} rows={1} placeholder="Pregúntale lo que quieras a Eon…" onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();e.currentTarget.form?.requestSubmit();}}}/>
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2"><Link href="/app/recuerdos" className="compose-action" aria-label="Guardar algo">＋</Link><span className="hidden sm:inline-flex eon-pill">Memoria activa</span></div>
        <div className="flex items-center gap-2"><Link href="/app/hablar" className="compose-action" aria-label="Conversación por voz">⌁</Link><button type="submit" disabled={!text.trim()||loading} className="eon-send-btn" aria-label="Enviar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></div>
      </div>
    </form>

    {!hasChat && <div className="eon-suggestions"><button onClick={()=>setText("¿Qué tengo pendiente?")}>¿Qué tengo pendiente?</button><button onClick={()=>setText("Crea un proyecto llamado ")}>Crear proyecto</button><button onClick={()=>setText("Recuérdame ")}>Crear pendiente</button><button onClick={()=>setText("Busca en mi memoria algo importante que haya olvidado")}>Busca en mi memoria</button><button onClick={()=>setText("¿Qué personas de mi red podrían ayudarme hoy?")}>¿A quién conozco?</button></div>}
  </div>;
}
