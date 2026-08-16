import { NextResponse } from "next/server";
import { authenticateMcpToken, auditMcp, type McpAccess, type McpScope } from "@/lib/data/mcp-access";
import { findUserById } from "@/lib/data/users";
import { searchMemories } from "@/lib/ai/rag";
import { listProjects, listTasks } from "@/lib/data/operations";
import { listNetworkPeople } from "@/lib/data/network";

export const runtime="nodejs";
export const maxDuration=60;

type Rpc={jsonrpc?:string;id?:string|number|null;method?:string;params?:Record<string,unknown>};
function rpc(id:Rpc["id"],result:unknown){return NextResponse.json({jsonrpc:"2.0",id:id??null,result},{headers:{"Cache-Control":"no-store"}})}
function rpcError(id:Rpc["id"],code:number,message:string){return NextResponse.json({jsonrpc:"2.0",id:id??null,error:{code,message}},{status:code===-32600?400:200,headers:{"Cache-Control":"no-store"}})}
function has(a:McpAccess,s:McpScope){return a.scopes.includes(s)}
function tools(a:McpAccess){const out:Array<Record<string,unknown>>=[]; if(has(a,"identity.read"))out.push({name:"identity_get",description:"Read the user's authorized Eternime identity profile.",inputSchema:{type:"object",properties:{}}}); if(has(a,"memory.read"))out.push({name:"memory_search",description:"Search the user's Eternime memory semantically. Returns only relevant memories, not the full archive.",inputSchema:{type:"object",properties:{query:{type:"string"},limit:{type:"number",minimum:1,maximum:10}},required:["query"]}}); if(has(a,"projects.read"))out.push({name:"projects_list",description:"List the user's active Eternime projects.",inputSchema:{type:"object",properties:{}}}); if(has(a,"tasks.read"))out.push({name:"tasks_list",description:"List the user's Eternime tasks and due dates.",inputSchema:{type:"object",properties:{status:{type:"string"}}}}); if(has(a,"network.search"))out.push({name:"network_search",description:"Search the user's authorized personal network by person, company, relationship, role or skill.",inputSchema:{type:"object",properties:{query:{type:"string"}},required:["query"]}}); return out;}
async function callTool(a:McpAccess,name:string,args:Record<string,unknown>){
 if(name==="identity_get"&&has(a,"identity.read")){const u=await findUserById(a.user_id); if(!u)return{}; return {name:u.name,tagline:u.tagline,bio:u.bio,location:u.location,occupation:u.occupation,personality_summary:u.personality_summary};}
 if(name==="memory_search"&&has(a,"memory.read")){const q=String(args.query||"").trim(); if(!q)return[]; return (await searchMemories(a.user_id,q,Math.min(10,Math.max(1,Number(args.limit)||6)))).map(m=>({id:m.id,title:m.title,content:m.content,kind:m.kind,score:m.score}));}
 if(name==="projects_list"&&has(a,"projects.read")){return (await listProjects(a.user_id)).map(p=>({id:p.id,name:p.name,description:p.description,status:p.status,updated_at:p.updated_at}));}
 if(name==="tasks_list"&&has(a,"tasks.read")){const status=String(args.status||""); return (await listTasks(a.user_id)).filter(t=>!status||t.status===status).map(t=>({id:t.id,title:t.title,notes:t.notes,status:t.status,priority:t.priority,due_at:t.due_at,project:t.project_name}));}
 if(name==="network_search"&&has(a,"network.search")){const q=String(args.query||"").trim().toLowerCase(); if(!q)return[]; return (await listNetworkPeople(a.user_id)).filter(p=>[p.name,p.email,p.phone,p.company,p.role,p.relationship,...(p.skills||[])].filter(Boolean).join(" ").toLowerCase().includes(q)).slice(0,20).map(p=>({id:p.id,name:p.name,company:p.company,role:p.role,relationship:p.relationship,skills:p.skills||[],confidence:p.confidence,visibility:p.visibility,source:p.source}));}
 throw new Error("Tool not allowed or not found");
}
export async function POST(req:Request){
 const auth=req.headers.get("authorization")||""; const token=auth.startsWith("Bearer ")?auth.slice(7).trim():""; const access=await authenticateMcpToken(token); if(!access)return NextResponse.json({error:"Unauthorized"},{status:401,headers:{"WWW-Authenticate":"Bearer"}});
 let body:Rpc; try{body=await req.json() as Rpc}catch{return rpcError(null,-32700,"Parse error")}
 const method=body.method||""; try{
  if(method==="initialize"){await auditMcp(access,method,null,true); return rpc(body.id,{protocolVersion:"2025-06-18",capabilities:{tools:{listChanged:false}},serverInfo:{name:"Eternime Trust MCP",version:"1.0.0"},instructions:"Eternime is the user's private memory layer. Use only the scopes and tools explicitly authorized by the user."});}
  if(method==="notifications/initialized"){await auditMcp(access,method,null,true); return new NextResponse(null,{status:202});}
  if(method==="tools/list"){await auditMcp(access,method,null,true); return rpc(body.id,{tools:tools(access)});}
  if(method==="tools/call"){const p=body.params||{}; const name=String(p.name||""); const args=(p.arguments&&typeof p.arguments==="object"?p.arguments:{}) as Record<string,unknown>; const result=await callTool(access,name,args); await auditMcp(access,method,name,true); return rpc(body.id,{content:[{type:"text",text:JSON.stringify(result)}],structuredContent:result});}
  if(method==="ping")return rpc(body.id,{});
  return rpcError(body.id,-32601,"Method not found");
 }catch(e){await auditMcp(access,method,String(body.params?.name||"")||null,false).catch(()=>{}); return rpc(body.id,{content:[{type:"text",text:e instanceof Error?e.message:"Tool error"}],isError:true});}
}
export async function GET(){return NextResponse.json({name:"Eternime Trust MCP",version:"1.0.0",endpoint:"/api/mcp",transport:"Streamable HTTP / stateless POST",authentication:"Bearer token generated inside Eternime"},{headers:{"Cache-Control":"no-store"}})}
