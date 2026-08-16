import "server-only";
import { sql as dsql } from "drizzle-orm";
import { getTenantDb, TenantNotReadyError } from "@/lib/db/tenant";
import type { GuideMessage } from "@/lib/data/types";

function rowsOf<T>(r: unknown): T[]{ return ((r as {rows?:T[]})?.rows ?? []) as T[]; }

export async function listTenantEonMessages(clerkId:string, limit=50):Promise<GuideMessage[]> {
  const db=await getTenantDb(clerkId);
  const r=await db.execute(dsql`
    WITH latest AS (SELECT id FROM conversations ORDER BY started_at DESC LIMIT 1)
    SELECT m.id::text, ''::text AS user_id,
           CASE WHEN m.role='ai' THEN 'assistant' ELSE 'user' END AS role,
           m.content, m.created_at
    FROM messages m JOIN latest l ON l.id=m.conversation_id
    ORDER BY m.created_at ASC LIMIT ${limit}`);
  return rowsOf<GuideMessage>(r);
}

export async function appendTenantEonExchange(clerkId:string,userText:string,assistantText:string):Promise<{userMessage:GuideMessage|null;assistantMessage:GuideMessage|null}> {
  const db=await getTenantDb(clerkId);
  let c=await db.execute(dsql`SELECT id::text FROM conversations ORDER BY started_at DESC LIMIT 1`);
  let cid=rowsOf<{id:string}>(c)[0]?.id;
  if(!cid){ c=await db.execute(dsql`INSERT INTO conversations(summary,message_count) VALUES(NULL,0) RETURNING id::text`); cid=rowsOf<{id:string}>(c)[0]?.id; }
  if(!cid) return {userMessage:null,assistantMessage:null};
  const u=await db.execute(dsql`INSERT INTO messages(conversation_id,role,content) VALUES(${cid}::uuid,'user',${userText}) RETURNING id::text, ''::text AS user_id, 'user'::text AS role, content, created_at`);
  const a=await db.execute(dsql`INSERT INTO messages(conversation_id,role,content) VALUES(${cid}::uuid,'ai',${assistantText}) RETURNING id::text, ''::text AS user_id, 'assistant'::text AS role, content, created_at`);
  await db.execute(dsql`UPDATE conversations SET message_count=message_count+2 WHERE id=${cid}::uuid`);
  return {userMessage:rowsOf<GuideMessage>(u)[0]??null,assistantMessage:rowsOf<GuideMessage>(a)[0]??null};
}

export async function storeEonLearnedContext(clerkId:string,content:string,sourceRef?:string,confidence=.7){
  const db=await getTenantDb(clerkId);
  await db.execute(dsql`CREATE TABLE IF NOT EXISTS eon_memory (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),kind text NOT NULL DEFAULT 'inference',content text NOT NULL,source_ref text,confidence real NOT NULL DEFAULT .7,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now())`);
  await db.execute(dsql`INSERT INTO eon_memory(kind,content,source_ref,confidence) VALUES('conversation',${content},${sourceRef??null},${confidence})`);
}

export { TenantNotReadyError };
