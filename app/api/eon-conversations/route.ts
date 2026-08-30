import { NextResponse } from "next/server";
import { AuthError, requireUser } from "@/lib/auth";
import { createTenantEonConversation, listTenantEonConversations, TenantNotReadyError } from "@/lib/data/eon-tenant";
import { ensureTenantForUser } from "@/lib/tenant/ensure";
import { listGuideMessages } from "@/lib/data/guide";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireUser();
    await ensureTenantForUser({ clerkId:session.clerkId, email:session.email, name:session.name }).catch(()=>null);
    try {
      const conversations = await listTenantEonConversations(session.clerkId);
      return NextResponse.json({ conversations, store:"tenant" });
    } catch (error) {
      if (!(error instanceof TenantNotReadyError)) console.warn("[eon-conversations] list fallback", error);
      const legacy = await listGuideMessages(session.sub);
      return NextResponse.json({
        conversations: legacy.length ? [{ id:"legacy", title:"Conversación anterior", started_at:legacy[0].created_at, message_count:legacy.length }] : [],
        store:"legacy",
      });
    }
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error:error.message }, { status:error.status });
    return NextResponse.json({ error:"No pude cargar tus conversaciones" }, { status:500 });
  }
}

export async function POST() {
  try {
    const session = await requireUser();
    await ensureTenantForUser({ clerkId:session.clerkId, email:session.email, name:session.name });
    const conversation = await createTenantEonConversation(session.clerkId);
    if (!conversation) return NextResponse.json({ error:"No pude crear la conversación" }, { status:500 });
    return NextResponse.json({ conversation }, { status:201 });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error:error.message }, { status:error.status });
    return NextResponse.json({ error:"Tu memoria privada todavía se está preparando" }, { status:503 });
  }
}
