"use client";
import { useEffect, useState } from "react";

type Scope="identity.read"|"memory.read"|"projects.read"|"tasks.read"|"network.search";
type Conn={id:string;label:string;provider:string;token_prefix:string;scopes:Scope[];created_at:string;last_used_at:string|null;revoked_at:string|null;can_reveal?:boolean};
const ALL:Scope[]=["identity.read","memory.read","projects.read","tasks.read","network.search"];
const LABELS:Record<Scope,string>={"identity.read":"Identidad","memory.read":"Memoria","projects.read":"Proyectos","tasks.read":"Pendientes","network.search":"Mi Red"};
const PROVIDERS=[{id:"chatgpt",name:"ChatGPT"},{id:"claude",name:"Claude"},{id:"gemini",name:"Gemini"},{id:"other",name:"Otra IA"}];
export function McpConnectionsClient(){
 const [items,setItems]=useState<Conn[]>([]); const [provider,setProvider]=useState("chatgpt"); const [scopes,setScopes]=useState<Scope[]>(["identity.read","memory.read","projects.read","tasks.read","network.search"]); const [token,setToken]=useState(""); const [creating,setCreating]=useState(false); const [copied,setCopied]=useState(false);
 const load=()=>fetch('/api/mcp/tokens').then(r=>r.json()).then(d=>setItems(d.connections||[])).catch(()=>{});
 useEffect(()=>{load()},[]);
 const toggle=(s:Scope)=>setScopes(v=>v.includes(s)?v.filter(x=>x!==s):[...v,s]);
 async function create(){setCreating(true);setToken("");try{const p=PROVIDERS.find(x=>x.id===provider);const r=await fetch('/api/mcp/tokens',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({label:p?.name||'Mi IA',provider,scopes})});const d=await r.json();if(r.ok){setToken(d.token||'');load()}}finally{setCreating(false)}}
 async function tokenAction(id:string,action:"reveal"|"rotate"){const r=await fetch("/api/mcp/tokens",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,action})});const d=await r.json();if(d.token){setToken(d.token);await copy(d.token)}else if(d.error)alert(d.error);load()}
 async function revoke(id:string){await fetch('/api/mcp/tokens?id='+encodeURIComponent(id),{method:'DELETE'});load()}
 async function copy(v:string){await navigator.clipboard.writeText(v);setCopied(true);setTimeout(()=>setCopied(false),1400)}
 return <div className="mcp-grid">
  <section className="mcp-hero va-crystal va-spatial">
   <div className="mcp-orbit" aria-hidden><i/><i/><i/><span className="eon-mini-orb"/></div>
   <p className="eon-page-kicker">Eon Trust · MCP</p><h2>Tu memoria puede acompañarte entre IAs.</h2>
   <p>ChatGPT, Claude, Gemini o la IA que uses pueden consultar sólo el contexto que tú autorices. Cambias de modelo sin volver a empezar de cero.</p>
   <div className="mcp-principles"><span>Tu memoria es tuya</span><span>Acceso revocable</span><span>Contexto mínimo necesario</span></div>
  </section>
  <section className="mcp-card">
   <div className="mcp-step"><b>1</b><div><strong>Elige la IA</strong><small>Cada IA recibe su propia llave.</small></div></div>
   <div className="mcp-provider-row">{PROVIDERS.map(p=><button key={p.id} className={provider===p.id?'active':''} onClick={()=>setProvider(p.id)}>{p.name}</button>)}</div>
   <div className="mcp-step"><b>2</b><div><strong>Decide qué puede conocer</strong><small>Bóveda y secretos quedan fuera.</small></div></div>
   <div className="mcp-scope-grid">{ALL.map(s=><button key={s} onClick={()=>toggle(s)} className={scopes.includes(s)?'active':''}><span>{scopes.includes(s)?'✓':'○'}</span>{LABELS[s]}</button>)}</div>
   <div className="mcp-step"><b>3</b><div><strong>Genera el acceso</strong><small>La llave sólo se muestra una vez.</small></div></div>
   <button className="mcp-create" disabled={!scopes.length||creating} onClick={create}>{creating?'Creando acceso…':'Conectar esta IA'}</button>
   {token&&<div className="mcp-token"><p>Guarda esta llave ahora. Eternime no puede volver a mostrártela.</p><code>{token}</code><button onClick={()=>copy(token)}>{copied?'Copiado':'Copiar llave'}</button><div className="mcp-endpoint"><span>Endpoint MCP</span><code>https://eternime.org/api/mcp</code><button onClick={()=>copy('https://eternime.org/api/mcp')}>Copiar</button></div></div>}
  </section>
  <section className="mcp-card mcp-guide"><p className="eon-page-kicker">Eon te acompaña</p><h3>¿No sabes cómo conectarlo?</h3><ol><li>Genera una llave para tu IA.</li><li>En la configuración MCP de esa IA agrega el endpoint de Eternime.</li><li>Usa la llave como Bearer token.</li><li>Prueba: “¿Qué recuerda Eternime sobre mis proyectos?”</li></ol><p className="mcp-note">La disponibilidad exacta de MCP depende del cliente de IA que uses. Eternime mantiene la memoria separada del modelo.</p></section>
  <section className="mcp-card"><div className="flex items-center justify-between"><div><p className="eon-page-kicker">Accesos activos</p><h3>Mis IAs</h3></div><span className="mcp-count">{items.filter(x=>!x.revoked_at).length}</span></div><div className="mcp-list">{items.length?items.map(x=><div className={`mcp-item ${x.revoked_at?'revoked':''}`} key={x.id}><div><strong>{x.label}</strong><small>{x.token_prefix}… · {x.scopes.map(s=>LABELS[s]).join(', ')}</small><small>{x.last_used_at?'Último uso: '+new Date(x.last_used_at).toLocaleString():'Todavía no se ha usado'}</small></div>{!x.revoked_at&&<div className="flex gap-1"><button onClick={()=>tokenAction(x.id,"reveal")}>Ver llave</button><button onClick={()=>tokenAction(x.id,"rotate")}>Rotar</button><button onClick={()=>revoke(x.id)}>Revocar</button></div>}</div>):<p className="mcp-empty">Aún no has conectado otra IA.</p>}</div></section>
 </div>
}
