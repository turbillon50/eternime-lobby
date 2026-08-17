"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
type Item={key:string;label:string;href:string;ok:boolean;detail:string};
export function ReadinessScore(){const[items,setItems]=useState<Item[]|null>(null);useEffect(()=>{Promise.all([
 fetch('/api/memories').then(r=>r.json()).catch(()=>({})),fetch('/api/network').then(r=>r.json()).catch(()=>({})),fetch('/api/projects').then(r=>r.json()).catch(()=>({})),fetch('/api/mcp/tokens').then(r=>r.json()).catch(()=>({})),fetch('/api/voice/clone').then(r=>r.json()).catch(()=>({})),fetch('/api/identity').then(r=>r.json()).catch(()=>({}))
]).then(([m,n,p,i,v,a])=>setItems([
 {key:'memory',label:'Memoria',href:'/app/recuerdos',ok:(m.memories||[]).length>0,detail:(m.memories||[]).length+' recuerdos'},
 {key:'network',label:'Mi Red',href:'/app/red',ok:(n.people||[]).length>0,detail:(n.people||[]).length+' personas'},
 {key:'projects',label:'Proyectos',href:'/app/proyectos',ok:(p.projects||[]).length>0,detail:(p.projects||[]).length+' activos'},
 {key:'mcp',label:'Mis IAs',href:'/app/ias',ok:(i.connections||[]).some((x:{revoked_at?:string|null})=>!x.revoked_at),detail:(i.connections||[]).filter((x:{revoked_at?:string|null})=>!x.revoked_at).length+' conectadas'},
 {key:'voice',label:'Tu voz',href:'/app/perfil',ok:Boolean(v.voiceId),detail:v.voiceId?'Clon activo':'Pendiente'},
 {key:'visual',label:'Identidad visual',href:'/app/perfil',ok:(a.assets||[]).length>=6,detail:(a.assets||[]).length+'/6 capturas'}
 ]))},[]);if(!items)return <section className="network-panel">Calculando preparación…</section>;const done=items.filter(x=>x.ok).length,score=Math.round(done/items.length*100);return <section className="readiness-card"><div className="readiness-score"><div className="readiness-ring" style={{background:`conic-gradient(#7469ff ${score}%,rgba(116,105,255,.1) 0)`}}><span>{score}%</span></div><div><p className="eon-page-kicker">Eternime Readiness</p><h3>{score>=85?'Tu Eon ya tiene una base fuerte.':score>=50?'Eon ya te está conociendo.':'Construyamos tu base personal.'}</h3><p>Completa identidad, memoria y conexiones para que Eon pueda ayudarte con más contexto.</p></div></div><div className="readiness-grid">{items.map(x=><Link key={x.key} href={x.href} className={x.ok?'done':''}><span>{x.ok?'✓':'○'}</span><div><b>{x.label}</b><small>{x.detail}</small></div><i>→</i></Link>)}</div></section>}
