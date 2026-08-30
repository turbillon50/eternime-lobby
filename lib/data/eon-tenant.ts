import "server-only";
import { sql as dsql } from "drizzle-orm";
import { getTenantDb, TenantNotReadyError } from "@/lib/db/tenant";
import type { EonConversation, GuideMessage } from "@/lib/data/types";

function rowsOf<T>(r: unknown): T[]{ return ((r as {rows?:T[]})?.rows ?? []) as T[]; }

export async function listTenantEonConversations(clerkId:string, limit=40):Promise<EonConversation[]> {
  const db=await getTenantDb(clerkId);
  const r=await db.execute(dsql`
    SELECT c.id::text,
           COALESCE(NULLIF(c.summary,''),
             (SELECT LEFT(m.content,72) FROM messages m WHERE m.conversation_id=c.id AND m.role='user' ORDER BY m.created_at ASC LIMIT 1),
             'Nueva conversación') AS title,
           c.started_at,
           (SELECT COUNT(*)::int FROM messages m WHERE m.conversation_id=c.id) AS message_count
    FROM conversations c
    ORDER BY c.started_at DESC
    LIMIT ${limit}`);
  return rowsOf<EonConversation>(r).map(row=>({...row,message_count:Number(row.message_count||0)}));
}

export async function createTenantEonConversation(clerkId:string):Promise<EonConversation|null> {
  const db=await getTenantDb(clerkId);
  const r=await db.execute(dsql`
    INSERT INTO conversations(summary,message_count)
    VALUES(NULL,0)
    RETURNING id::text, 'Nueva conversación'::text AS title, started_at, message_count`);
  return rowsOf<EonConversation>(r)[0]??null;
}

export async function deleteTenantEonConversation(clerkId:string, conversationId:string):Promise<boolean> {
  const db=await getTenantDb(clerkId);
  const r=await db.execute(dsql`DELETE FROM conversations WHERE id=${conversationId}::uuid RETURNING id::text`);
  return rowsOf<{id:string}>(r).length>0;
}

export async function listTenantEonMessages(clerkId:string, conversationId?:string|null, limit=80):Promise<{conversationId:string|null;messages:GuideMessage[]}> {
  const db=await getTenantDb(clerkId);
  const selected=conversationId
    ? await db.execute(dsql`SELECT id::text FROM conversations WHERE id=${conversationId}::uuid LIMIT 1`)
    : await db.execute(dsql`SELECT id::text FROM conversations ORDER BY started_at DESC LIMIT 1`);
  const cid=rowsOf<{id:string}>(selected)[0]?.id??null;
  if(!cid) return {conversationId:null,messages:[]};
  const r=await db.execute(dsql`
    SELECT m.id::text, ''::text AS user_id,
           CASE WHEN m.role='ai' THEN 'assistant' ELSE 'user' END AS role,
           m.content, m.created_at
    FROM messages m
    WHERE m.conversation_id=${cid}::uuid
    ORDER BY m.created_at ASC LIMIT ${limit}`);
  return {conversationId:cid,messages:rowsOf<GuideMessage>(r)};
}

export async function appendTenantEonExchange(clerkId:string,userText:string,assistantText:string,conversationId?:string|null):Promise<{conversationId:string|null;userMessage:GuideMessage|null;assistantMessage:GuideMessage|null}> {
  const db=await getTenantDb(clerkId);
  let c=conversationId
    ? await db.execute(dsql`SELECT id::text FROM conversations WHERE id=${conversationId}::uuid LIMIT 1`)
    : await db.execute(dsql`SELECT id::text FROM conversations ORDER BY started_at DESC LIMIT 1`);
  let cid=rowsOf<{id:string}>(c)[0]?.id;
  if(!cid){ c=await db.execute(dsql`INSERT INTO conversations(summary,message_count) VALUES(NULL,0) RETURNING id::text`); cid=rowsOf<{id:string}>(c)[0]?.id; }
  if(!cid) return {conversationId:null,userMessage:null,assistantMessage:null};
  const u=await db.execute(dsql`INSERT INTO messages(conversation_id,role,content) VALUES(${cid}::uuid,'user',${userText}) RETURNING id::text, ''::text AS user_id, 'user'::text AS role, content, created_at`);
  const a=await db.execute(dsql`INSERT INTO messages(conversation_id,role,content) VALUES(${cid}::uuid,'ai',${assistantText}) RETURNING id::text, ''::text AS user_id, 'assistant'::text AS role, content, created_at`);
  await db.execute(dsql`UPDATE conversations SET message_count=message_count+2,summary=COALESCE(NULLIF(summary,''),LEFT(${userText},72)) WHERE id=${cid}::uuid`);
  return {conversationId:cid,userMessage:rowsOf<GuideMessage>(u)[0]??null,assistantMessage:rowsOf<GuideMessage>(a)[0]??null};
}

export async function storeEonLearnedContext(clerkId:string,content:string,sourceRef?:string,confidence=.7){
  const db=await getTenantDb(clerkId);
  await db.execute(dsql`CREATE TABLE IF NOT EXISTS eon_memory (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),kind text NOT NULL DEFAULT 'inference',content text NOT NULL,source_ref text,confidence real NOT NULL DEFAULT .7,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now())`);
  await db.execute(dsql`INSERT INTO eon_memory(kind,content,source_ref,confidence) VALUES('conversation',${content},${sourceRef??null},${confidence})`);
}

export { TenantNotReadyError };
