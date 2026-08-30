import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { listGuideMessages, appendGuideMessage } from "@/lib/data/guide";
import { listMemories, createMemory, countConversationMemories } from "@/lib/data/memories";
import { answerAsEon, refreshPersonalitySummary } from "@/lib/ai/eon";
import { storeMemoryEmbedding } from "@/lib/ai/rag";
import { listTenantEonMessages, appendTenantEonExchange, storeEonLearnedContext, TenantNotReadyError } from "@/lib/data/eon-tenant";
import { ensureTenantForUser } from "@/lib/tenant/ensure";
import { createProject, createTask, listProjects, listTasks } from "@/lib/data/operations";


async function executeDirectAction(userId: string, content: string): Promise<string | null> {
  const t = content.trim();
  const project = t.match(/^(?:eon[,,: ]*)?(?:crea|crear|inicia|iniciar) (?:un )?proyecto(?: llamado| de)?[ :]+(.+)$/i);
  if (project?.[1]) {
    const name = project[1].replace(/[.!]+$/, "").trim();
    const made = await createProject(userId, name);
    return made ? `Listo. Creé el proyecto “${made.name}”.` : null;
  }
  const task = t.match(/^(?:eon[,,: ]*)?(?:recuérdame|recuerdame|crea (?:un )?pendiente(?: para)?|anota (?:como )?pendiente)[ :]+(.+)$/i);
  if (task?.[1]) {
    const title = task[1].replace(/[.!]+$/, "").trim();
    const made = await createTask(userId, { title });
    return made ? `Hecho. Guardé “${made.title}” en tus pendientes.` : null;
  }
  if (/^(?:eon[,,: ]*)?¿?qué tengo pendiente|^(?:eon[,,: ]*)?mis pendientes/i.test(t)) {
    const tasks = (await listTasks(userId)).filter(x => x.status === "open").slice(0, 6);
    if (!tasks.length) return "No tienes pendientes abiertos.";
    return `Tienes ${tasks.length}${tasks.length === 6 ? " o más" : ""}: ${tasks.map((x,i)=>`${i+1}. ${x.title}`).join(" · ")}`;
  }
  if (/^(?:eon[,,: ]*)?¿?(?:cuáles|cuales|mis) proyectos|^(?:eon[,,: ]*)?¿?qué proyectos/i.test(t)) {
    const projects = (await listProjects(userId)).filter(x => x.status === "active").slice(0, 6);
    if (!projects.length) return "Todavía no tienes proyectos activos. Puedo crear uno desde aquí.";
    return `Tus proyectos activos: ${projects.map(x=>x.name).join(" · ")}.`;
  }
  return null;
}

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
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

export async function GET(request:Request) {
  try {
    const session = await requireUser();
    const requestedId = new URL(request.url).searchParams.get("conversationId");
    if (requestedId && requestedId !== "legacy" && !UUID.test(requestedId)) return NextResponse.json({ error:"Conversación inválida" }, { status:400 });
    await ensureTenantForUser({clerkId:session.clerkId,email:session.email,name:session.name}).catch(()=>null);
    try {
      const selected = await listTenantEonMessages(session.clerkId, requestedId === "legacy" ? null : requestedId);
      if (requestedId && requestedId !== "legacy" && !selected.conversationId) return NextResponse.json({ error:"La conversación ya no existe" }, { status:404 });
      return NextResponse.json({ messages:selected.messages, conversationId:selected.conversationId, store:"tenant" });
    } catch (e) {
      if (!(e instanceof TenantNotReadyError)) console.warn("[guide] tenant read fallback", e);
      const messages = await listGuideMessages(session.sub);
      return NextResponse.json({ messages, conversationId:"legacy", store:"legacy" });
    }
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    await ensureTenantForUser({clerkId:session.clerkId,email:session.email,name:session.name}).catch(()=>null);
    const body = (await request.json()) as { content?: string; conversationId?: string | null };
    const content = (body.content ?? "").trim();
    if (!content) return NextResponse.json({ error: "El mensaje no puede estar vacío" }, { status: 400 });
    const conversationId = body.conversationId ?? null;
    if (conversationId && conversationId !== "legacy" && !UUID.test(conversationId)) return NextResponse.json({ error:"Conversación inválida" }, { status:400 });

    let history;
    try { history = (await listTenantEonMessages(session.clerkId, conversationId === "legacy" ? null : conversationId)).messages; }
    catch { history = await listGuideMessages(session.sub); }
    const userMessage = { id:`local-${Date.now()}`, user_id:session.sub, role:"user" as const, content, created_at:new Date().toISOString() };

    let reply: string | null = await executeDirectAction(session.sub, content).catch(()=>null);
    let cited: Array<{ id: string; title: string }> = [];
    try {
      const eon = reply ? null : await answerAsEon({ userId: session.sub, message: content, history });
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

    let assistantMessage = null;
    let store = "tenant";
    let resolvedConversationId = conversationId;
    try {
      const saved = await appendTenantEonExchange(session.clerkId, content, reply, conversationId === "legacy" ? null : conversationId);
      resolvedConversationId = saved.conversationId;
      assistantMessage = saved.assistantMessage;
      await storeEonLearnedContext(session.clerkId, `Usuario: ${content}\nEon: ${reply}`, assistantMessage?.id ?? undefined, .75).catch(()=>{});
    } catch {
      store = "legacy";
      await appendGuideMessage({ userId: session.sub, role: "user", content });
      assistantMessage = await appendGuideMessage({ userId: session.sub, role: "assistant", content: reply });
    }

    await captureConversationAsMemory(session.sub, content);

    return NextResponse.json({ userMessage, assistantMessage, reply, cited, store, conversationId:resolvedConversationId }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
