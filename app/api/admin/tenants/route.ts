import { NextResponse } from "next/server";
import { eq,desc } from "drizzle-orm";
import { requireAdmin,AuthError } from "@/lib/auth";
import { getControlDb } from "@/lib/db/control";
import { users,tenantsRegistry } from "@/lib/db/schema/control-plane";
export async function GET(){try{await requireAdmin();const db=getControlDb();const rows=await db.select({id:users.id,email:users.email,name:users.name,plan:users.plan,status:users.status,branchId:users.tenantBranchId,sizeBytes:tenantsRegistry.sizeBytes,lastActivityAt:tenantsRegistry.lastActivityAt,createdAt:users.createdAt}).from(users).leftJoin(tenantsRegistry,eq(tenantsRegistry.ownerUserId,users.id)).orderBy(desc(users.createdAt)).limit(250);return NextResponse.json({tenants:rows})}catch(e){if(e instanceof AuthError)return NextResponse.json({error:e.message},{status:e.status});return NextResponse.json({error:"Error interno"},{status:500})}}
