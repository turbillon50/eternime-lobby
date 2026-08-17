import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getTenantDb, tenantSchema } from "@/lib/db/tenant";

async function dbFor(clerkId:string){
  const db=await getTenantDb(clerkId);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS identity_assets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), pose text NOT NULL, blob_url text NOT NULL, mime text, consented_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz, created_at timestamptz NOT NULL DEFAULT now())`);
  return db;
}
export async function listIdentityAssets(clerkId:string){const db=await dbFor(clerkId);return db.select().from(tenantSchema.identityAssets).where(isNull(tenantSchema.identityAssets.deletedAt)).orderBy(tenantSchema.identityAssets.createdAt);}
export async function addIdentityAsset(clerkId:string,input:{pose:string;url:string;mime?:string|null}){const db=await dbFor(clerkId);const r=await db.insert(tenantSchema.identityAssets).values({pose:input.pose,blobUrl:input.url,mime:input.mime??null}).returning();return r[0]??null;}
export async function deleteIdentityAsset(clerkId:string,id:string){const db=await dbFor(clerkId);const r=await db.update(tenantSchema.identityAssets).set({deletedAt:new Date()}).where(and(eq(tenantSchema.identityAssets.id,id),isNull(tenantSchema.identityAssets.deletedAt))).returning({id:tenantSchema.identityAssets.id});return r.length>0;}
