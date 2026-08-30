import { NextResponse } from "next/server";
import { AuthError, requireUser } from "@/lib/auth";
import { deleteTenantEonConversation } from "@/lib/data/eon-tenant";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(_request:Request, context:{ params:Promise<{id:string}> }) {
  try {
    const session = await requireUser();
    const { id } = await context.params;
    if (!UUID.test(id)) return NextResponse.json({ error:"Conversación inválida" }, { status:400 });
    const deleted = await deleteTenantEonConversation(session.clerkId, id);
    if (!deleted) return NextResponse.json({ error:"La conversación ya no existe" }, { status:404 });
    return NextResponse.json({ deleted:true });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error:error.message }, { status:error.status });
    return NextResponse.json({ error:"No pude eliminar la conversación" }, { status:500 });
  }
}
