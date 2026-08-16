import "server-only";
import crypto from "node:crypto";
import { getSql } from "@/lib/db";

export const MCP_SCOPES = ["identity.read","memory.read","projects.read","tasks.read","network.search"] as const;
export type McpScope = typeof MCP_SCOPES[number];
export type McpAccess = { id:string; user_id:string; label:string; provider:string; token_prefix:string; scopes:McpScope[]; created_at:string; last_used_at:string|null; revoked_at:string|null; can_reveal?:boolean };

function key(){
  const raw=process.env.MCP_TOKEN_ENCRYPTION_KEY||process.env.TENANT_URL_ENCRYPTION_KEY||process.env.CLERK_SECRET_KEY||"";
  if(!raw) throw new Error("Missing MCP token encryption key");
  return crypto.createHash("sha256").update(raw).digest();
}
function encryptToken(token:string){const iv=crypto.randomBytes(12);const c=crypto.createCipheriv("aes-256-gcm",key(),iv);const enc=Buffer.concat([c.update(token,"utf8"),c.final()]);return [iv.toString("base64url"),c.getAuthTag().toString("base64url"),enc.toString("base64url")].join(".");}
function decryptToken(payload:string){const [iv,tag,data]=payload.split(".");const d=crypto.createDecipheriv("aes-256-gcm",key(),Buffer.from(iv,"base64url"));d.setAuthTag(Buffer.from(tag,"base64url"));return Buffer.concat([d.update(Buffer.from(data,"base64url")),d.final()]).toString("utf8");}
async function ensureMcpSchema(){
  const sql=getSql(); if(!sql) return null;
  await sql`CREATE TABLE IF NOT EXISTS eternime_mcp_access (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id text NOT NULL, label text NOT NULL,
    provider text NOT NULL DEFAULT 'other', token_hash text NOT NULL UNIQUE, token_prefix text NOT NULL,
    token_encrypted text,
    scopes text[] NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(),
    last_used_at timestamptz, revoked_at timestamptz
  )`;
  await sql`ALTER TABLE eternime_mcp_access ADD COLUMN IF NOT EXISTS token_encrypted text`;
  await sql`CREATE INDEX IF NOT EXISTS idx_eternime_mcp_access_user ON eternime_mcp_access(user_id, created_at DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS eternime_mcp_audit (
    id bigserial PRIMARY KEY, access_id uuid REFERENCES eternime_mcp_access(id) ON DELETE SET NULL,
    user_id text NOT NULL, method text NOT NULL, tool text, ok boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  return sql;
}
function hashToken(token:string){ return crypto.createHash("sha256").update(token).digest("hex"); }
export async function listMcpAccess(userId:string):Promise<McpAccess[]>{ const sql=await ensureMcpSchema(); if(!sql)return[]; const rows=await sql`SELECT id,user_id,label,provider,token_prefix,scopes,created_at,last_used_at,revoked_at,(token_encrypted IS NOT NULL) AS can_reveal FROM eternime_mcp_access WHERE user_id=${userId} ORDER BY created_at DESC`; return rows as McpAccess[]; }
export async function createMcpAccess(userId:string,input:{label:string;provider:string;scopes:McpScope[]}){ const sql=await ensureMcpSchema(); if(!sql)return null; const token=`etmcp_${crypto.randomBytes(32).toString("base64url")}`; const hash=hashToken(token); const prefix=token.slice(0,12); const encrypted=encryptToken(token); const scopes=input.scopes.filter(s=>MCP_SCOPES.includes(s)); const r=await sql`INSERT INTO eternime_mcp_access(user_id,label,provider,token_hash,token_prefix,token_encrypted,scopes) VALUES(${userId},${input.label},${input.provider},${hash},${prefix},${encrypted},${scopes}::text[]) RETURNING id,user_id,label,provider,token_prefix,scopes,created_at,last_used_at,revoked_at`; return { access:r[0] as McpAccess, token }; }
export async function ensureDefaultMcpAccess(userId:string){const existing=await listMcpAccess(userId); if(existing.some(x=>x.provider==="eternime-default"&&!x.revoked_at))return null; return createMcpAccess(userId,{label:"Mi IA de confianza",provider:"eternime-default",scopes:["identity.read","memory.read","projects.read","tasks.read","network.search"]});}
export async function revealMcpToken(userId:string,id:string){const sql=await ensureMcpSchema();if(!sql)return null;const r=await sql`SELECT token_encrypted FROM eternime_mcp_access WHERE id=${id} AND user_id=${userId} AND revoked_at IS NULL LIMIT 1`;const enc=r[0]?.token_encrypted as string|undefined;if(!enc)return null;try{return decryptToken(enc)}catch{return null}}
export async function rotateMcpAccess(userId:string,id:string){const sql=await ensureMcpSchema();if(!sql)return null;const token=`etmcp_${crypto.randomBytes(32).toString("base64url")}`;const hash=hashToken(token);const encrypted=encryptToken(token);const prefix=token.slice(0,12);const r=await sql`UPDATE eternime_mcp_access SET token_hash=${hash},token_prefix=${prefix},token_encrypted=${encrypted},last_used_at=NULL WHERE id=${id} AND user_id=${userId} AND revoked_at IS NULL RETURNING id`;return r.length?token:null}
export async function revokeMcpAccess(userId:string,id:string){ const sql=await ensureMcpSchema(); if(!sql)return false; const r=await sql`UPDATE eternime_mcp_access SET revoked_at=now() WHERE id=${id} AND user_id=${userId} AND revoked_at IS NULL RETURNING id`; return r.length>0; }
export async function authenticateMcpToken(token:string):Promise<McpAccess|null>{ const sql=await ensureMcpSchema(); if(!sql||!token.startsWith("etmcp_"))return null; const hash=hashToken(token); const r=await sql`SELECT id,user_id,label,provider,token_prefix,scopes,created_at,last_used_at,revoked_at FROM eternime_mcp_access WHERE token_hash=${hash} AND revoked_at IS NULL LIMIT 1`; if(!r[0])return null; await sql`UPDATE eternime_mcp_access SET last_used_at=now() WHERE id=${(r[0] as McpAccess).id}`; return r[0] as McpAccess; }
export async function auditMcp(access:McpAccess,method:string,tool:string|null,ok=true){ const sql=await ensureMcpSchema(); if(!sql)return; await sql`INSERT INTO eternime_mcp_audit(access_id,user_id,method,tool,ok) VALUES(${access.id},${access.user_id},${method},${tool},${ok})`; }
