import { NextResponse } from "next/server";
import { eq, sql as dsql } from "drizzle-orm";
import { requireUser, AuthError } from "@/lib/auth";
import { getControlDb } from "@/lib/db/control";
import { users, tenantsRegistry } from "@/lib/db/schema/control-plane";
import { getTenantDb } from "@/lib/db/tenant";
import { listMcpAccess } from "@/lib/data/mcp-access";

const DEFAULT_QUOTA = 256 * 1024 * 1024;
export async function GET(){
 try{
  const s=await requireUser(); const control=getControlDb();
  const rows=await control.select({id:users.id,plan:users.plan,status:users.status,branchId:users.tenantBranchId,sizeBytes:tenantsRegistry.sizeBytes}).from(users).leftJoin(tenantsRegistry,eq(tenantsRegistry.ownerUserId,users.id)).where(eq(users.clerkId,s.clerkId)).limit(1);
  const u=rows[0]; let size=Number(u?.sizeBytes||0); let measured=false;
  if(u?.status==="ready") try{const db=await getTenantDb(s.clerkId); const r=await db.execute(dsql`select pg_database_size(current_database())::bigint as bytes`); const first=(r as unknown as {rows?:Array<{bytes:string|number}>}).rows?.[0]; if(first?.bytes!==undefined){size=Number(first.bytes);measured=true; if(u.branchId) await control.update(tenantsRegistry).set({sizeBytes:size,lastActivityAt:new Date()}).where(eq(tenantsRegistry.branchId,u.branchId));}}catch{}
  const mcp=await listMcpAccess(s.sub);
  return NextResponse.json({tenant:{status:u?.status||"pending",branchId:u?.branchId||null},usage:{databaseBytes:size,quotaBytes:DEFAULT_QUOTA,measured,percent:Math.min(100,Math.round(size/DEFAULT_QUOTA*1000)/10)},plan:u?.plan||"free",mcp:{active:mcp.filter(x=>!x.revoked_at).length,total:mcp.length}});
 }catch(e){if(e instanceof AuthError)return NextResponse.json({error:e.message},{status:e.status});return NextResponse.json({error:"Error interno"},{status:500})}
}
