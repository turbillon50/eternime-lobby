import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { listGuideMessages, appendGuideMessage } from "@/lib/data/guide";
import { listMemories, createMemory, countConversationMemories } from "@/lib/data/memories";
import { answerAsEon, refreshPersonalitySummary } from "@/lib/ai/eon";
import { storeMemoryEmbedding } from "@/lib/ai/rag";

const MIN_CAPTURABLE_LENGTH = 40;
const PERSONALITY_REFRESH_EVERY = 5;

async function captureConversationAsMemory(userId: string, userText: string): Promise<void> {
  const text = userText.trim();
  if (text.length < MIN_CAPTURABLE_LENGTH) return;
  try {
    const title = text.length > 60 ? text.slice(0, 57) + "…" : text;
    const mem = await createMemory({
      userId,
      title,
      content: text,
      kind: "texto",
      source: "conversacion",
    });
    if (mem) {
      await storeMemoryEmbedding(mem.id, userId, text);
      const n = await countConversationMemories(userId);
      if (n > 0 && n % PERSONALITY_REFRESH_EVERY === 0) {
        await refreshPersonalitySummary(userId);
      }
    }
  } catch (e) {
    console.error("[guide-messages] captureConversationAsMemory failed:", e instanceof Error ? e.message : e);
  }
}

export const runtime = "nodejs";
export const maxDuration = 60;

/** Guía local (fallback cálido) cuando la IA no responde. */
function localGuideReply(userText: string, memoryCount: number): string {
  const text = userText.toLowerCase();
  if (/hola|buen[oa]s|saludos|qué tal|que tal/.test(text)) {
    return "Hola. Qué bueno tenerte aquí de nuevo. Cada conversación hace tu legado un poco más vivo. ¿Quieres contarme algo de hoy, o prefieres que exploremos un recuerdo de hace tiempo?";
  }
  if (memoryCount === 0) {
    return "Te escucho. Para conocerte mejor, me encantaría que guardaras tu primer recuerdo: piensa en un momento que aún sientas vivo cuando cierras los ojos. ¿Cuál sería?";
  }
  return `Gracias por compartirlo conmigo. Cada cosa que me cuentas me ayuda a entender quién eres. ¿Qué historia te gustaría que tu familia pudiera preguntarte algún día?`;
}

export async function GET() {
  try {
    const session = await requireUser();
    const messages = await listGuideMessages(session.sub);
    return NextResponse.json({ messages });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const body = (await request.json()) as { content?: string };
    const content = (body.content ?? "").trim();
    if (!content) return NextResponse.json({ error: "El mensaje no puede estar vacío" }, { status: 400 });

    const userMessage = await appendGuideMessage({ userId: session.sub, role: "user", content });

    const history = await listGuideMessages(session.sub);

    let reply: string | null = null;
    let cited: Array<{ id: string; title: string }> = [];
    try {
      const eon = await answerAsEon({ userId: session.sub, message: content, history });
      if (eon) {
        reply = eon.reply;
        cited = eon.cited.map((m) => ({ id: m.id, title: m.title }));
      }
    } catch {
      reply = null;
    }
    if (!reply) {
      const memories = await listMemories(session.sub);
      reply = localGuideReply(content, memories.length);
    }

    const assistantMessage = await appendGuideMessage({ userId: session.sub, role: "assistant", content: reply });

    await captureConversationAsMemory(session.sub, content);

    return NextResponse.json({ userMessage, assistantMessage, reply, cited }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
