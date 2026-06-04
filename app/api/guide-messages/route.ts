import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { listGuideMessages, appendGuideMessage } from "@/lib/data/guide";
import { listMemories } from "@/lib/data/memories";
import { createGuideResponse } from "@/lib/eternime/openai";
import { createPersonalAgentState } from "@/lib/eternime/personal-memory-agent";
import type { MemoryRecord } from "@/lib/eternime/types";
import type { Memory } from "@/lib/data/types";

export const runtime = "nodejs";

/** Mapea recuerdos de la app al formato del agente personal (lib/eternime). */
function toMemoryRecords(memories: Memory[], ownerId: string): MemoryRecord[] {
  return memories.slice(0, 12).map((m) => ({
    id: m.id,
    ownerId,
    kind: m.kind === "carta" ? "legacy" : m.kind === "voz" ? "voice" : "origin",
    title: m.title,
    text: m.content ?? m.title,
    emotionalWeight: 5,
    sensitivity: "private",
    tags: m.emotional_tone ? [m.emotional_tone] : [],
    embedding: [],
    embeddingModel: "none",
    embeddingProvider: "local",
    createdAt: m.created_at,
  }));
}

/** Guía local en español — fallback cálido cuando no hay OpenAI configurado. */
function localGuideReply(userText: string, memoryCount: number): string {
  const text = userText.toLowerCase();
  if (/hola|buen[oa]s|saludos|qué tal|que tal/.test(text)) {
    return "Hola. Qué bueno tenerte aquí de nuevo. Cada conversación que tenemos hace tu legado un poco más vivo. ¿Quieres contarme algo que haya pasado hoy, o prefieres que exploremos un recuerdo de hace tiempo?";
  }
  if (/triste|duele|extraño|extrano|perd[íi]|murió|murio|falleci/.test(text)) {
    return "Gracias por confiarme algo tan delicado. Los recuerdos que duelen también merecen un lugar — a veces son los que más dicen de cuánto amamos. Cuando estés listo, podemos guardarlo como un recuerdo, con el tono que tú elijas.";
  }
  if (/recuerdo|memoria|infancia|niñez|ninez|cuando era/.test(text)) {
    return "Eso que me cuentas vale la pena preservarlo. Te propongo algo: guárdalo como un recuerdo en tu colección, con el tono emocional que mejor lo describa. ¿Qué detalle de ese momento se te quedó grabado — un olor, una voz, una luz?";
  }
  if (/carta|escribir|mensaje|dedicar/.test(text)) {
    return "Una carta de legado es de los regalos más poderosos que puedes dejar. Piensa en una persona y en la fecha exacta en la que quieres que tus palabras le lleguen. Yo te acompaño mientras la escribes.";
  }
  if (/famili|hij[oa]|espos[oa]|madre|padre|mam[áa]|pap[áa]|herman/.test(text)) {
    return "Las personas que nombras son el corazón de tu legado. ¿Ya las agregaste como beneficiarias? Así, cuando llegue el momento, tus recuerdos y cartas llegarán exactamente a sus manos.";
  }
  if (memoryCount === 0) {
    return "Te escucho. Para conocerte mejor, me encantaría que guardaras tu primer recuerdo: piensa en un momento que aún sientas vivo cuando cierras los ojos. ¿Cuál sería?";
  }
  return `Gracias por compartirlo conmigo. Llevas ${memoryCount} ${memoryCount === 1 ? "recuerdo preservado" : "recuerdos preservados"} y cada uno me ayuda a entender quién eres. ¿Qué historia te gustaría que tu familia pudiera preguntarte algún día?`;
}

export async function GET() {
  try {
    const session = await requireUser();
    const messages = await listGuideMessages(session.sub);
    return NextResponse.json({ messages });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const body = (await request.json()) as { content?: string };
    const content = (body.content ?? "").trim();
    if (!content) {
      return NextResponse.json({ error: "El mensaje no puede estar vacío" }, { status: 400 });
    }

    const userMessage = await appendGuideMessage({
      userId: session.sub,
      role: "user",
      content,
    });

    // Contexto: recuerdos reales del usuario para la guía.
    const memories = await listMemories(session.sub);
    const records = toMemoryRecords(memories, session.sub);
    const state = createPersonalAgentState(session.sub, records);

    let reply: string | null = null;
    try {
      reply = await createGuideResponse({ state, memories: records });
    } catch {
      reply = null;
    }
    if (!reply) {
      reply = localGuideReply(content, memories.length);
    }

    const assistantMessage = await appendGuideMessage({
      userId: session.sub,
      role: "assistant",
      content: reply,
    });

    return NextResponse.json(
      { userMessage, assistantMessage, reply },
      { status: 201 },
    );
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
