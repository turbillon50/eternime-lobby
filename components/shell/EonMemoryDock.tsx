"use client";

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import Link from "next/link";
import { uploadFile } from "@/lib/upload-client";

type DockMode="idle"|"recording"|"dictating"|"uploading"|"saving";
type Notice={tone:"success"|"error";text:string}|null;
type RecognitionEvent={resultIndex:number;results:ArrayLike<ArrayLike<{transcript:string}>>};
type RecognitionError={error?:string};
type Recognition={lang:string;continuous:boolean;interimResults:boolean;start:()=>void;stop:()=>void;abort:()=>void;onresult:((event:RecognitionEvent)=>void)|null;onerror:((event:RecognitionError)=>void)|null;onend:(()=>void)|null};
type RecognitionConstructor=new()=>Recognition;

function Icon({children}:{children:ReactNode}){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{children}</svg>}
function stamp(){return new Intl.DateTimeFormat("es-MX",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}).format(new Date());}

export function EonMemoryDock(){
  const cameraRef=useRef<HTMLInputElement>(null);
  const recorderRef=useRef<MediaRecorder|null>(null);
  const streamRef=useRef<MediaStream|null>(null);
  const chunksRef=useRef<Blob[]>([]);
  const durationRef=useRef(0);
  const timerRef=useRef<number|null>(null);
  const recognitionRef=useRef<Recognition|null>(null);
  const noticeTimerRef=useRef<number|null>(null);
  const [mode,setMode]=useState<DockMode>("idle");
  const [seconds,setSeconds]=useState(0);
  const [panelOpen,setPanelOpen]=useState(false);
  const [text,setText]=useState("");
  const [notice,setNotice]=useState<Notice>(null);

  function haptic(pattern:number|number[]){navigator.vibrate?.(pattern);}
  function showNotice(next:Notice){setNotice(next);if(noticeTimerRef.current)window.clearTimeout(noticeTimerRef.current);noticeTimerRef.current=window.setTimeout(()=>setNotice(null),3200);}
  function stopTracks(){streamRef.current?.getTracks().forEach(track=>track.stop());streamRef.current=null;}
  function stopTimer(){if(timerRef.current!==null)window.clearInterval(timerRef.current);timerRef.current=null;}

  async function createMemory(input:{title:string;content?:string;kind:"texto"|"voz"|"foto";mediaUrls?:string[]}){
    setMode("saving");
    const response=await fetch("/api/memories",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});
    const data=await response.json().catch(()=>({})) as {error?:string};
    if(!response.ok)throw new Error(data.error||"No pude guardar el recuerdo");
    haptic([12,35,18]);window.dispatchEvent(new Event("eon:memory-created"));
  }

  async function capturePhoto(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];event.target.value="";if(!file)return;
    setMode("uploading");setNotice(null);
    try{
      const uploaded=await uploadFile(file,"file","Captura rápida desde Eternime");
      await createMemory({title:`Foto · ${stamp()}`,kind:"foto",mediaUrls:[uploaded.url]});
      showNotice({tone:"success",text:"Foto guardada en tu memoria"});
    }catch(reason){showNotice({tone:"error",text:reason instanceof Error?reason.message:"No pude guardar la foto"});}
    finally{setMode("idle");}
  }

  async function saveRecordedAudio(blob:Blob){
    setMode("uploading");
    try{
      const extension=blob.type.includes("mp4")?"m4a":"webm";
      const file=new File([blob],`recuerdo-${Date.now()}.${extension}`,{type:blob.type||"audio/webm"});
      const uploaded=await uploadFile(file,"file","Audio capturado desde Eternime");
      await createMemory({title:`Audio · ${stamp()}`,content:`Nota de voz de ${durationRef.current} segundos.`,kind:"voz",mediaUrls:[uploaded.url]});
      showNotice({tone:"success",text:"Audio guardado en tu memoria"});
    }catch(reason){showNotice({tone:"error",text:reason instanceof Error?reason.message:"No pude guardar el audio"});}
    finally{stopTracks();stopTimer();setSeconds(0);setMode("idle");}
  }

  async function startRecording(){
    setNotice(null);
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});streamRef.current=stream;chunksRef.current=[];
      const recorder=new MediaRecorder(stream);recorderRef.current=recorder;
      recorder.ondataavailable=event=>{if(event.data.size)chunksRef.current.push(event.data);};
      recorder.onstop=()=>{const blob=new Blob(chunksRef.current,{type:recorder.mimeType||"audio/webm"});void saveRecordedAudio(blob);};
      recorder.start();durationRef.current=0;setSeconds(0);setMode("recording");haptic([15,30,15]);
      timerRef.current=window.setInterval(()=>setSeconds(value=>{durationRef.current=value+1;return value+1;}),1000);
    }catch(reason){stopTracks();showNotice({tone:"error",text:reason instanceof DOMException&&reason.name==="NotAllowedError"?"Activa el permiso del micrófono para grabar":"No pude abrir el micrófono"});setMode("idle");}
  }
  function stopRecording(){if(recorderRef.current?.state==="recording"){stopTimer();recorderRef.current.stop();haptic(16);}}

  function startDictation(){
    setPanelOpen(true);setNotice(null);
    const speechWindow=window as typeof window&{SpeechRecognition?:RecognitionConstructor;webkitSpeechRecognition?:RecognitionConstructor};
    const Speech=speechWindow.SpeechRecognition??speechWindow.webkitSpeechRecognition;
    if(!Speech){showNotice({tone:"error",text:"Usa el micrófono del teclado para dictar en este dispositivo"});return;}
    const recognition=new Speech();recognition.lang="es-MX";recognition.continuous=true;recognition.interimResults=false;recognitionRef.current=recognition;
    recognition.onresult=event=>{let transcript="";for(let i=event.resultIndex;i<event.results.length;i++)transcript+=`${event.results[i][0]?.transcript??""} `;setText(current=>`${current}${current?" ":""}${transcript.trim()}`);};
    recognition.onerror=event=>{showNotice({tone:"error",text:event.error==="not-allowed"?"Activa el permiso del micrófono para dictar":"El dictado se interrumpió"});setMode("idle");};
    recognition.onend=()=>setMode("idle");
    try{recognition.start();setMode("dictating");haptic(12);}catch{setMode("idle");}
  }
  function stopDictation(){recognitionRef.current?.stop();recognitionRef.current=null;setMode("idle");}

  async function saveText(){
    const content=text.trim();if(!content)return;
    try{await createMemory({title:content.length>62?`${content.slice(0,59)}…`:content,content,kind:"texto"});setText("");setPanelOpen(false);showNotice({tone:"success",text:"Recuerdo guardado"});}
    catch(reason){showNotice({tone:"error",text:reason instanceof Error?reason.message:"No pude guardar el recuerdo"});}
    finally{setMode("idle");}
  }

  useEffect(()=>()=>{if(recorderRef.current?.state==="recording"){recorderRef.current.onstop=null;recorderRef.current.stop();}stopTracks();stopTimer();recognitionRef.current?.abort();if(noticeTimerRef.current)window.clearTimeout(noticeTimerRef.current);},[]);

  const busy=mode==="uploading"||mode==="saving";
  return <div className="eon-memory-dock-wrap">
    <input ref={cameraRef} hidden type="file" accept="image/*" capture="environment" onChange={capturePhoto}/>
    {panelOpen&&<section className="eon-memory-quick" role="dialog" aria-label="Guardar un recuerdo rápido">
      <header><div><small>{mode==="dictating"?"Escuchando":"Captura rápida"}</small><b>{mode==="dictating"?"Habla con naturalidad":"¿Qué quieres recordar?"}</b></div><button type="button" onClick={()=>{stopDictation();setPanelOpen(false);}} aria-label="Cerrar">×</button></header>
      <textarea autoFocus value={text} onChange={event=>setText(event.target.value)} placeholder="Escribe o dicta una idea, decisión o momento…" rows={3}/>
      <footer>{mode==="dictating"?<button type="button" className="is-listening" onClick={stopDictation}><i/> Terminar dictado</button>:<button type="button" onClick={startDictation}><Icon><path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3ZM5 11a7 7 0 0 0 14 0M12 18v3"/></Icon> Dictar</button>}<button type="button" className="is-primary" onClick={()=>void saveText()} disabled={!text.trim()||busy}>{busy?"Guardando…":"Guardar recuerdo"}</button></footer>
    </section>}
    {notice&&<div className={`eon-memory-notice is-${notice.tone}`} role="status">{notice.tone==="success"?"✓":"!"}<span>{notice.text}</span></div>}
    <nav className={`eon-memory-dock ${mode==="recording"?"is-recording":""}`} aria-label="Captura rápida de memoria">
      <button type="button" onClick={()=>cameraRef.current?.click()} disabled={busy||mode==="recording"} aria-label="Tomar foto"><Icon><path d="M4 7h4l1.5-2h5L16 7h4v12H4z"/><circle cx="12" cy="13" r="3.5"/></Icon><span>Foto</span></button>
      <button type="button" onClick={mode==="recording"?stopRecording:()=>void startRecording()} disabled={busy||mode==="dictating"} aria-label={mode==="recording"?"Terminar grabación":"Grabar audio"} className={mode==="recording"?"is-active":""}><Icon>{mode==="recording"?<rect x="7" y="7" width="10" height="10" rx="2"/>:<><path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3ZM5 11a7 7 0 0 0 14 0M12 18v3"/></>}</Icon><span>{mode==="recording"?`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,"0")}`:"Audio"}</span></button>
      <button type="button" className="eon-memory-dock__primary" onClick={()=>{setPanelOpen(true);setText("");}} disabled={busy||mode==="recording"} aria-label="Escribir un recuerdo"><span>+</span><small>Recordar</small></button>
      <button type="button" onClick={mode==="dictating"?stopDictation:startDictation} disabled={busy||mode==="recording"} className={mode==="dictating"?"is-active":""} aria-label="Dictar un recuerdo"><Icon><path d="M4 12a8 8 0 0 0 16 0M7 12a5 5 0 0 0 10 0M12 4v8"/></Icon><span>Dictar</span></button>
      <Link href="/app/recuerdos" aria-label="Abrir recuerdos"><Icon><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v18H6.5A2.5 2.5 0 0 1 4 18.5v-13ZM20 5.5A2.5 2.5 0 0 0 17.5 3H12v18h5.5a2.5 2.5 0 0 0 2.5-2.5v-13Z"/></Icon><span>Memoria</span></Link>
    </nav>
  </div>;
}
