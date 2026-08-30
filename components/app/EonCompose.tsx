"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { GuideMessage } from "@/lib/data/types";
import { EonSignal, LivingMesh, LightSweep } from "@/components/visual/VisualArtifacts";

type Citation = { id: string; title: string };
type ApiResponse = { messages?: GuideMessage[]; reply?: string; error?: string; cited?: Citation[]; assistantMessage?: GuideMessage | null; conversationId?:string|null };

export function EonCompose({ firstName = "" }: { firstName?: string }) {
  const router=useRouter();
  const searchParams=useSearchParams();
  const requestedConversationId=searchParams.get("chat");
  const [messages, setMessages] = useState<GuideMessage[]>([]);
  const [conversationId,setConversationId]=useState<string|null>(requestedConversationId);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const followRef = useRef(true);
  const loadVersionRef=useRef(0);
  const [citations, setCitations] = useState<Record<string, Citation[]>>({});

  useEffect(() => {
    const controller=new AbortController();
    const version=++loadVersionRef.current;
    const frame=requestAnimationFrame(()=>{setLoaded(false);setError("");setMessages([]);setConversationId(requestedConversationId);});
    const query=requestedConversationId?`?conversationId=${encodeURIComponent(requestedConversationId)}`:"";
    fetch(`/api/guide-messages${query}`,{signal:controller.signal,cache:"no-store"}).then(async r => ({ ok:r.ok, data: await r.json() as ApiResponse })).then(({ok,data}) => {
      if(version!==loadVersionRef.current)return;
      if(!ok)throw new Error(data.error||"No pude abrir esta conversación");
      setMessages(data.messages??[]);setConversationId(data.conversationId??requestedConversationId);
      if(!requestedConversationId&&data.conversationId)router.replace(`/app?chat=${encodeURIComponent(data.conversationId)}`,{scroll:false});
    }).catch(reason=>{if(version===loadVersionRef.current&&!(reason instanceof DOMException&&reason.name==="AbortError"))setError(reason instanceof Error?reason.message:"No pude abrir esta conversación");}).finally(()=>{if(version===loadVersionRef.current&&!controller.signal.aborted)setLoaded(true);});
    return()=>{cancelAnimationFrame(frame);controller.abort();};
  }, [requestedConversationId,router]);
  useEffect(() => {
    if (!followRef.current) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    endRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block:"nearest" });
  }, [messages, loading]);
  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => { const el=areaRef.current; if(!el) return; el.style.height="auto"; el.style.height=String(Math.min(el.scrollHeight,180))+"px"; }, [text]);
  useEffect(()=>{
    const viewport=window.visualViewport;
    const setHeight=()=>document.documentElement.style.setProperty("--eon-visual-height",`${viewport?.height??window.innerHeight}px`);
    setHeight();viewport?.addEventListener("resize",setHeight);viewport?.addEventListener("scroll",setHeight);
    return()=>{viewport?.removeEventListener("resize",setHeight);viewport?.removeEventListener("scroll",setHeight);document.documentElement.style.removeProperty("--eon-visual-height");};
  },[]);

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
      const res = await fetch("/api/guide-messages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({content,conversationId}), signal:controller.signal });
      const data = await res.json() as ApiResponse;
      if (!res.ok) throw new Error(data.error || "No pude responder");
      if(data.conversationId&&data.conversationId!==conversationId){setConversationId(data.conversationId);router.replace(`/app?chat=${encodeURIComponent(data.conversationId)}`,{scroll:false});}
      const reply = data.reply || "Estoy aquí.";
      const id = data.assistantMessage?.id || ("eon-" + Date.now());
      setMessages(m => [...m, { id, user_id:"eon", role:"assistant", content:reply, created_at:new Date().toISOString() }]);
      if (data.cited?.length) setCitations(c => ({ ...c, [id]: data.cited! }));
      window.dispatchEvent(new Event("eon:conversations-changed"));
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
      <EonSignal state={loading ? "thinking" : error ? "error" : "idle"} />
      <p className="eon-kicker"><i /> EON está presente</p>
      <h1>¿En qué puedo ayudarte{firstName ? `, ${firstName}` : ""}?</h1>
      <p className="eon-sub">Tu memoria, tus proyectos y tus personas, unidos en una sola conversación.</p>
    </section>}

    {hasChat && <section className="eon-thread" aria-live="polite" onScroll={event => { const node = event.currentTarget; followRef.current = node.scrollHeight - node.scrollTop - node.clientHeight < 96; }}>
      {messages.map(m => <div key={m.id} className={`eon-message ${m.role}`}><div>{m.content}</div>{citations[m.id]?.length ? <div className="eon-citations"><span>Memoria consultada</span>{citations[m.id].slice(0,3).map(c=><Link key={c.id} href={`/app/recuerdos?memory=${encodeURIComponent(c.id)}`}>{c.title}</Link>)}</div> : null}</div>)}
      {loading && <div className="eon-message assistant"><div className="eon-thinking"><i/><i/><i/><span>Eon está pensando</span></div></div>}
      {error && <div className="eon-inline-error" role="alert"><span>{error}</span><button type="button" onClick={()=>setError("")}>Cerrar</button></div>}
      <div ref={endRef}/>
    </section>}

    <form className="eon-compose-card eon-compose-real" onSubmit={send} aria-label="Escribir a Eon">
      <textarea ref={areaRef} value={text} onChange={e=>setText(e.target.value)} rows={1} placeholder="Pregúntale lo que quieras a Eon…" onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();e.currentTarget.form?.requestSubmit();}}}/>
      <div className="eon-compose-toolbar">
        <div className="eon-compose-tools"><Link href="/app/boveda" className="compose-action" aria-label="Abrir la bóveda para adjuntar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m20.5 11.5-8.8 8.8a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 1 1-2.8-2.8l8.5-8.5"/></svg></Link><span className="hidden sm:inline-flex eon-pill"><i/> Memoria activa</span></div>
        <div className="eon-compose-tools"><Link href="/app/hablar" className="compose-action" aria-label="Conversación por voz"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3ZM5 11a7 7 0 0 0 14 0M12 18v3"/></svg></Link>{loading ? <button type="button" onClick={stop} className="eon-send-btn is-stop" aria-label="Detener respuesta"><span/></button> : <button type="submit" disabled={!text.trim()} className="eon-send-btn" aria-label="Enviar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg></button>}</div>
      </div>
    </form>

    {!hasChat && <div className="eon-suggestions"><button onClick={()=>setText("¿Qué tengo pendiente?")}>¿Qué tengo pendiente?</button><button onClick={()=>setText("Crea un proyecto llamado ")}>Crear proyecto</button><button onClick={()=>setText("Recuérdame ")}>Crear pendiente</button><button onClick={()=>setText("Busca en mi memoria algo importante que haya olvidado")}>Busca en mi memoria</button><button onClick={()=>setText("¿Qué personas de mi red podrían ayudarme hoy?")}>¿A quién conozco?</button></div>}
  </div>;
}
