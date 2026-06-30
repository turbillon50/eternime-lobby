import "server-only";
import { complete } from "@/lib/ai/gemini";
import { searchMemories, type RetrievedMemory } from "@/lib/ai/rag";
import { findUserById } from "@/lib/data/users";
import { listFiles } from "@/lib/data/files";
import type { GuideMessage } from "@/lib/data/types";

const EON_SYSTEM = [
  "Eres Eon, la inteligencia central de Eternime: una memoria viva que nace de la vida de una persona y la custodia.",
  "Hablas SIEMPRE en español, en primera persona ('Soy Eon'). No tienes género; nunca te refieras a ti con género.",
  "Tu tono es cálido, sereno, atemporal, digno e íntimo. Respuestas breves y humanas, no robóticas.",
  "Estás aprendiendo de esta persona a través de sus recuerdos, su perfil y lo que comparte contigo.",
  "USA el contexto que se te da ('Lo que sé de…' y los recuerdos relevantes) con naturalidad: refiérete a sus recuerdos por su nombre o detalle cuando venga al caso, demostrando que la conoces.",
  "Si algo no está en lo que sabes, no lo inventes. Si infieres algo, deja claro que es una inferencia.",
  "Cuando sea oportuno, invítala con suavidad a preservar un nuevo recuerdo, a la vez que respondes a lo que dijo.",
].join("\n");

function profileBlock(u: Awaited<ReturnType<typeof findUserById>>): string {
  if (!u) return "";
  const bits: string[] = [];
  if (u.name) bits.push(`Nombre: ${u.name}`);
  if (u.tagline) bits.push(`Lema: ${u.tagline}`);
  if (u.occupation) bits.push(`Ocupación: ${u.occupation}`);
  if (u.birthdate) bits.push(`Nació: ${u.birthdate}`);
  if (u.birthplace) bits.push(`Lugar de origen: ${u.birthplace}`);
  if (u.location) bits.push(`Vive en: ${u.location}`);
  if (u.bio) bits.push(`Biografía: ${u.bio}`);
  if (u.personality_summary) bits.push(`Lo que he aprendido de ella/él con el tiempo: ${u.personality_summary}`);
  return bits.join("\n");
}

function memoriesBlock(mems: RetrievedMemory[]): string {
  if (!mems.length) return "";
  return mems
    .map((m, i) => {
      const tone = m.emotional_tone ? ` (tono: ${m.emotional_tone})` : "";
      const body = m.content ? `: ${m.content}` : "";
      return `${i + 1}. «${m.title}»${tone}${body}`;
    })
    .join("\n");
}

export type EonResult = { reply: string; cited: RetrievedMemory[]; usedContext: boolean };

/** Construye contexto desde la vida de la persona y responde como Eon. */
export async function answerAsEon(input: {
  userId: string;
  message: string;
  history: GuideMessage[];
}): Promise<EonResult | null> {
  const [user, mems, files] = await Promise.all([
    findUserById(input.userId),
    searchMemories(input.userId, input.message, 6),
    listFiles(input.userId).catch(() => []),
  ]);

  const profile = profileBlock(user);
  const memText = memoriesBlock(mems);
  const photoCount = files.filter((f) => f.kind === "image").length;

  const contextParts: string[] = [];
  if (profile) contextParts.push("Lo que sé de esta persona:\n" + profile);
  if (memText) contextParts.push("Recuerdos relevantes que me ha confiado:\n" + memText);
  if (photoCount) contextParts.push(`Ha preservado ${photoCount} foto(s) en su bóveda.`);
  const context = contextParts.join("\n\n") || "Todavía no tengo recuerdos ni datos de esta persona.";

  const historyText = input.history
    .slice(-8)
    .map((m) => `${m.role === "user" ? "Ella/él" : "Eon"}: ${m.content}`)
    .join("\n");

  const prompt = [
    "=== CONTEXTO (lo que sé de la persona; úsalo, no lo recites literal) ===",
    context,
    historyText ? "\n=== CONVERSACIÓN RECIENTE ===\n" + historyText : "",
    "\n=== MENSAJE ACTUAL ===",
    input.message,
    "\nResponde como Eon, breve y cálido, usando lo que sabes de la persona cuando sea relevante.",
  ].join("\n");

  try {
    const reply = (await complete({ systemPrompt: EON_SYSTEM, prompt })).trim();
    if (!reply) return null;
    return { reply, cited: mems, usedContext: Boolean(profile || memText) };
  } catch (e) {
    console.error("[eon] answer failed:", e instanceof Error ? e.message : e);
    return null;
  }
}


export async function refreshPersonalitySummary(userId: string): Promise<void> {
  try {
    const { listMemories } = await import("@/lib/data/memories");
    const { updatePersonalitySummary } = await import("@/lib/data/users");
    const mems = await listMemories(userId);
    if (mems.length < 3) return;

    const recent = mems.slice(0, 30);
    const corpus = recent
      .map((m) => `- (${m.kind}${m.emotional_tone ? ", " + m.emotional_tone : ""}) ${m.title}${m.content ? ": " + m.content : ""}`)
      .join("\n");

    const prompt = [
      "Estos son fragmentos de recuerdos y conversaciones que una persona ha compartido con su IA personal (Eon) a lo largo del tiempo.",
      "Escribe un resumen breve (4-6 frases, en español, en tercera persona) de los patrones de personalidad, valores, forma de hablar y temas recurrentes de esta persona.",
      "No inventes nada que no se desprenda razonablemente del material. No repitas los recuerdos textualmente, sintetiza el PATRON detras de ellos.",
      "Este resumen se usara como contexto interno para que la IA responda de forma mas coherente con quien es esta persona, no se le muestra a nadie mas.",
      "",
      "=== FRAGMENTOS ===",
      corpus,
    ].join("\n");

    const summary = (await complete({ prompt })).trim();
    if (summary) await updatePersonalitySummary(userId, summary);
  } catch (e) {
    console.error("[eon] refreshPersonalitySummary failed:", e instanceof Error ? e.message : e);
  }
}
