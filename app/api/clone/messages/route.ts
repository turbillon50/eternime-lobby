import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { complete } from "@/lib/ai/gemini";
import { cloneSnapshot, getCloneExchange, profileSignature, reviewCloneExchange, saveCloneExchange } from "@/lib/data/clone";
import { cloneSystemPrompt } from "@/lib/clone/profile";
import { CloneError } from "@/lib/clone/errors";
import { cloneErrorResponse, PRIVATE_HEADERS, UUID } from "@/lib/clone/http";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const body = await request.json();
    if (typeof body?.id !== "string" || !UUID.test(body.id) || typeof body.content !== "string" ||
        !body.content.trim() || body.content.length > 4000) {
      return NextResponse.json({ error: "Escribe un mensaje de hasta 4,000 caracteres." }, { status: 400 });
    }
    const text = body.content.trim();
    const existing = await getCloneExchange(session.clerkId, body.id);
    if (existing) {
      if (existing.user_text !== text) throw new CloneError("REQUEST_CONFLICT", "Ese mensaje ya fue enviado con otro contenido.", 409);
      return NextResponse.json({ exchange: existing }, { headers: PRIVATE_HEADERS });
    }
    const snapshot = await cloneSnapshot(session.clerkId);
    if (!snapshot.facts.some(f => f.content.trim())) throw new CloneError("PROFILE_EMPTY", "Confirma primero algo sobre ti en Mi memoria.", 409);
    const reply = (await complete({
      systemPrompt: cloneSystemPrompt(session.name, snapshot.facts),
      prompt: JSON.stringify({ recentConversation: snapshot.messages.slice(-12).map(m => ({ role: m.role, content: m.content })), message: text }),
    })).trim();
    if (!reply) throw new CloneError("AI_UNAVAILABLE", "No pude responder en este momento. Puedes reintentar.");
    const exchange = await saveCloneExchange(session.clerkId, { id: body.id, userText: text, cloneText: reply, signature: profileSignature(snapshot.facts) });
    return NextResponse.json({ exchange }, { status: 201, headers: PRIVATE_HEADERS });
  } catch (error) { return cloneErrorResponse(error); }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireUser();
    const body = await request.json();
    if (typeof body?.id !== "string" || !UUID.test(body.id) || typeof body.recognized !== "boolean") {
      return NextResponse.json({ error: "Selecciona si te reconoces en esta respuesta." }, { status: 400 });
    }
    await reviewCloneExchange(session.clerkId, body.id, body.recognized);
    return NextResponse.json(await cloneSnapshot(session.clerkId), { headers: PRIVATE_HEADERS });
  } catch (error) { return cloneErrorResponse(error); }
}
