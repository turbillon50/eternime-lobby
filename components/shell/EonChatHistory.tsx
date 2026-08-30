"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { EonConversation } from "@/lib/data/types";

type ConversationsResponse = { conversations?:EonConversation[]; conversation?:EonConversation; error?:string };

function BubbleIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 12a8 8 0 0 1-8 8H6l-4 2 1.4-4A9 9 0 1 1 21 12Z"/></svg>;
}

export function EonChatHistory({ close }:{ close:()=>void }) {
  const router=useRouter();
  const params=useSearchParams();
  const activeId=params.get("chat");
  const [items,setItems]=useState<EonConversation[]>([]);
  const [loading,setLoading]=useState(true);
  const [creating,setCreating]=useState(false);
  const [confirmId,setConfirmId]=useState<string|null>(null);
  const [error,setError]=useState("");

  const load=useCallback(async()=>{
    try {
      const response=await fetch("/api/eon-conversations",{cache:"no-store"});
      const data=await response.json() as ConversationsResponse;
      if(!response.ok) throw new Error(data.error||"No pude cargar tus chats");
      setItems(data.conversations??[]);
    } catch(reason) {
      setError(reason instanceof Error?reason.message:"No pude cargar tus chats");
    } finally { setLoading(false); }
  },[]);

  useEffect(()=>{const frame=requestAnimationFrame(()=>void load());const refresh=()=>void load();window.addEventListener("eon:conversations-changed",refresh);return()=>{cancelAnimationFrame(frame);window.removeEventListener("eon:conversations-changed",refresh);};},[load]);

  async function createChat(){
    if(creating)return;
    setCreating(true);setError("");
    try{
      const response=await fetch("/api/eon-conversations",{method:"POST"});
      const data=await response.json() as ConversationsResponse;
      if(!response.ok||!data.conversation)throw new Error(data.error||"No pude crear el chat");
      setItems(current=>[data.conversation!,...current]);
      window.dispatchEvent(new Event("eon:conversations-changed"));
      router.push(`/app?chat=${encodeURIComponent(data.conversation.id)}`);
      close();
    }catch(reason){setError(reason instanceof Error?reason.message:"No pude crear el chat");}
    finally{setCreating(false);}
  }

  async function deleteChat(id:string){
    setError("");
    try{
      const response=await fetch(`/api/eon-conversations/${encodeURIComponent(id)}`,{method:"DELETE"});
      const data=await response.json() as ConversationsResponse;
      if(!response.ok)throw new Error(data.error||"No pude eliminar el chat");
      const remaining=items.filter(item=>item.id!==id);
      setItems(remaining);setConfirmId(null);
      window.dispatchEvent(new Event("eon:conversations-changed"));
      if(activeId===id){const next=remaining[0];router.push(next?`/app?chat=${encodeURIComponent(next.id)}`:"/app");close();}
    }catch(reason){setError(reason instanceof Error?reason.message:"No pude eliminar el chat");}
  }

  return <section className="eon-chat-history" aria-label="Tus conversaciones con Eon">
    <div className="eon-chat-history__head"><p>Conversaciones</p><button type="button" onClick={createChat} disabled={creating} aria-label="Crear una conversación nueva"><span>+</span>{creating?"Creando…":"Nuevo chat"}</button></div>
    {error&&<p className="eon-chat-history__error" role="alert">{error}</p>}
    {loading?<div className="eon-chat-history__loading"><i/><i/><i/></div>:items.length===0?<p className="eon-chat-history__empty">Tu primer chat aparecerá aquí.</p>:<div className="eon-chat-history__list">
      {items.map(item=><div key={item.id} className={`eon-chat-history__item ${activeId===item.id?"is-active":""}`}>
        <button type="button" className="eon-chat-history__open" onClick={()=>{router.push(`/app?chat=${encodeURIComponent(item.id)}`);close();}}><BubbleIcon/><span><b>{item.title}</b><small>{item.message_count} {item.message_count===1?"mensaje":"mensajes"}</small></span></button>
        {item.id!=="legacy"&&(confirmId===item.id?<span className="eon-chat-history__confirm"><button type="button" onClick={()=>void deleteChat(item.id)}>Eliminar</button><button type="button" onClick={()=>setConfirmId(null)}>No</button></span>:<button type="button" className="eon-chat-history__delete" onClick={()=>setConfirmId(item.id)} aria-label={`Eliminar ${item.title}`}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></svg></button>)}
      </div>)}
    </div>}
  </section>;
}
