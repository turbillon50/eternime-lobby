import "server-only";
import { eq } from "drizzle-orm";
import { getControlDb } from "@/lib/db/control";
import { users } from "@/lib/db/schema/control-plane";
import { provisionTenant } from "@/lib/tenant/provision";

export async function ensureTenantForUser(input:{clerkId:string;email:string;name:string}){
  const db=getControlDb();
  const [u]=await db.select({status:users.status,branchId:users.tenantBranchId}).from(users).where(eq(users.clerkId,input.clerkId)).limit(1);
  if(u?.status==="ready"&&u.branchId)return {status:"ready" as const,alreadyProvisioned:true,branchId:u.branchId};
  if (u?.status === "suspended" || u?.status === "provisioning" || u?.branchId) return { status: "error" as const, error: "El espacio personal no puede prepararse automáticamente en su estado actual." };
  return provisionTenant({clerkId:input.clerkId,email:input.email,name:input.name});
}
