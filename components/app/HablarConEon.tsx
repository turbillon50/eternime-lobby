"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type Status = "idle" | "connecting" | "connected" | "error";
type Mode = "listening" | "speaking";
type Session = { endSession: () => Promise<void> | void };

export function HablarConEon(){
  const [status,setStatus]=useState<Status>("idle");
  const [mode,setMode]=useState<Mode>("listening");
  const [error,setError]=useState("");
  const [caption,setCaption]=useState("");
  const [usingCloned,setUsingCloned]=useState(false);
  const [hasClonedVoice,setHasClonedVoice]=useState<boolean|null>(null);
  const sessionRef=useRef<Session|null>(null);
  const turnsRef=useRef<Array<{role:"user"|"assistant";content:string}>>([]);

  const flushTranscript=useCallback(()=>{
    const turns=turnsRef.current; turnsRef.current=[]; if(!turns.length)return;
    const body=JSON.stringify({turns});
    try{if(navigator.sendBeacon?.("/api/voice/transcript",new Blob([body],{type:"application/json"})))return;}catch{}
    void fetch("/api/voice/transcript",{method:"POST",headers:{"Content-Type":"application/json"},body,keepalive:true}).catch(()=>{});
  },[]);

  const stop=useCallback(async()=>{try{await sessionRef.current?.endSession();}catch{} sessionRef.current=null;flushTranscript();setStatus("idle");setMode("listening");},[flushTranscript]);
  useEffect(()=>()=>{void stop();},[stop]);
  useEffect(()=>{let alive=true;fetch("/api/voice/clone").then(r=>r.json()).then(d=>{if(alive)setHasClonedVoice(Boolean(d.voiceId));}).catch(()=>{if(alive)setHasClonedVoice(null);});return()=>{alive=false;};},[]);

  const start=async()=>{
    setError("");setStatus("connecting");setCaption("");
    try{
      await navigator.mediaDevices.getUserMedia({audio:true});
      const res=await fetch("/api/voice/agent",{method:"POST"}); const data=await res.json();
      if(!res.ok){setError(data.error??"No se pudo iniciar");setStatus("error");return;}
      setUsingCloned(Boolean(data.usingClonedVoice));
      const {Conversation}=await import("@elevenlabs/client");
      const session=await Conversation.startSession({signedUrl:data.signedUrl,overrides:data.overrides,onConnect:()=>setStatus("connected"),onDisconnect:()=>{setStatus("idle");setMode("listening");flushTranscript();},onError:(msg:unknown)=>{setError(String(msg));setStatus("error");},onModeChange:(m:{mode:Mode})=>setMode(m.mode),onMessage:(m:{message:string;source:string})=>{if(!m?.message)return;setCaption(m.message);turnsRef.current.push({role:m.source==="user"?"user":"assistant",content:m.message});}});
      sessionRef.current=session as unknown as Session;
    }catch(e){setError(e instanceof Error&&e.name==="NotAllowedError"?"Necesito permiso de micrófono para escucharte.":(e instanceof Error?e.message:"No se pudo iniciar"));setStatus("error");}
  };

  const active=status==="connected"; const speaking=active&&mode==="speaking";
  return <div className="eon-voice-stage">
    <div className={`eon-live-field ${active?"is-active":""} ${speaking?"is-speaking":""}`} aria-hidden><span/><span/><span/><span/></div>
    <p className="eon-kicker">Eon · conversación en vivo</p>
    <h1>{status==="connecting"?"Conectando…":active?(speaking?"Eon está respondiendo":"Te escucho"):"Habla con Eon"}</h1>
    <p className="eon-sub">No necesitas ordenar tus ideas. Habla como hablarías contigo mismo.</p>
    <motion.button type="button" onClick={active||status==="connecting"?stop:start} aria-label={active?"Terminar conversación":"Hablar con Eon"} className="eon-live-button" whileTap={{scale:.96}}>{status==="connecting"?<span className="loader"/>:active?<span className="stop-square"/>:<span className="voice-bars"><i/><i/><i/></span>}</motion.button>
    <div className="eon-live-status">{status==="idle"&&"Toca para comenzar"}{status==="connecting"&&"Preparando tu conversación"}{active&&(speaking?"Eon está hablando":"Escuchando")}{status==="error"&&error}</div>
    {caption&&active?<p className="eon-live-caption">{caption}</p>:null}
    {hasClonedVoice===false?<a href="#clona-voz" className="eon-live-link">Personaliza la voz de Eon</a>:null}
    {active&&usingCloned?<p className="eon-live-note">Usando tu voz personalizada.</p>:null}
  </div>;
}
