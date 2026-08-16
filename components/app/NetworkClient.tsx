"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Person={id:string;name:string;email?:string|null;relationship?:string|null;is_primary?:boolean};
type Connection={provider:string;provider_user_name?:string|null;last_synced_at?:string|null};
const skills=["Finanzas","Real estate","Tecnología","Legal","Diseño","Ventas"];
export function NetworkClient(){
 const [people,setPeople]=useState<Person[]>([]); const [connections,setConnections]=useState<Connection[]>([]); const [q,setQ]=useState("");
 useEffect(()=>{Promise.all([fetch('/api/beneficiaries').then(r=>r.ok?r.json():{}),fetch('/api/social/connections').then(r=>r.ok?r.json():{})]).then(([rawP,rawS])=>{const p=rawP as {beneficiaries?:Person[];people?:Person[]}; const s=rawS as {connections?:Connection[]}; setPeople(p.beneficiaries||p.people||[]);setConnections(s.connections||[])}).catch(()=>{})},[]);
 const filtered=useMemo(()=>{const x=q.toLowerCase().trim();if(!x)return people;return people.filter(p=>`${p.name} ${p.relationship||''} ${p.email||''}`.toLowerCase().includes(x))},[people,q]);
 return <>
  <section className="network-search"><div className="eon-presence network-orb" aria-hidden><span/><span/><span/></div><div><p className="eon-page-kicker">Pregúntale a tu red</p><h2>¿A quién necesitas encontrar?</h2><p>Busca por persona, relación o capacidad. Eon irá enriqueciendo estos caminos con tu actividad.</p></div><label><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Ej. alguien que sepa de finanzas…"/></label><div className="network-skills">{skills.map(s=><button key={s} onClick={()=>setQ(s)}>{s}</button>)}</div></section>
  <section className="network-canvas"><div className="network-center"><span className="eon-mini-orb"/><b>Tú</b></div>{filtered.slice(0,8).map((p,i)=><div key={p.id} className={`network-node n${i%8}`}><span>{p.name?.[0]||'·'}</span><b>{p.name}</b><small>{p.relationship||'contacto directo'}</small></div>)}{!filtered.length&&<div className="network-empty">Tu grafo empieza vacío a propósito.<br/><Link href="/app/beneficiarios">Agrega personas</Link> o conecta tus redes.</div>}</section>
  <div className="grid gap-3 sm:grid-cols-2"><section className="network-panel"><p className="eon-page-kicker">Fuentes conectadas</p><h3>Tu contexto social</h3>{connections.length?connections.map(c=><div className="network-source" key={c.provider}><span>✓</span><div><b>{c.provider}</b><small>{c.provider_user_name||'Conectado'}</small></div></div>):<p className="network-muted">Facebook e Instagram ya tienen integración disponible cuando decidas conectarlos.</p>}</section><section className="network-panel"><p className="eon-page-kicker">Privacidad</p><h3>Tú decides qué cruza la red.</h3><p className="network-muted">Privado por defecto. Eon puede conocer una relación sin revelar tus conversaciones ni tus datos sensibles.</p></section></div>
 </>;
}
