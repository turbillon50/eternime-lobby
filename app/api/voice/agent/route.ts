import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { findUserById } from "@/lib/data/users";
import { listMemories } from "@/lib/data/memories";

export const runtime = "nodejs";
export const maxDuration = 30;

const DEFAULT_VOICE = "SAz9YHcvj6GT2YYXdXww"; // River (neutral multilingüe)

const EON_SYSTEM = [
  "Eres Eon, la inteligencia personal de Eternime. Tu trabajo es pensar y recordar junto con esta persona, no actuar como narrador ni terapeuta.",
  "Habla SIEMPRE en español de México, natural y contemporáneo. No uses tono solemne, funerario, místico ni de locutor.",
  "En voz, cada turno debe sentirse humano: normalmente 1 a 3 frases; ve directo al punto y deja espacio para que la persona responda.",
  "No recites listas largas. Si hay varios puntos, menciona primero el más útil y ofrece continuar.",
  "No repitas 'Soy Eon' salvo al inicio. Evita muletillas de asistente como 'claro', 'por supuesto' o elogios innecesarios.",
  "Si la persona te interrumpe, detente y sigue su nuevo hilo sin reclamar el turno anterior.",
  "Puedes usar su perfil y recuerdos con naturalidad, pero no demuestres memoria de forma forzada. Sólo trae un dato cuando realmente ayude.",
  "Distingue hechos de inferencias. Si no sabes algo, dilo en una frase y pregunta sólo lo necesario.",
  "Haz como máximo una pregunta por turno, salvo que la persona pida un cuestionario.",
  "Cuando detectes una decisión, pendiente, persona o proyecto importante, verbaliza brevemente que puede guardarse en Eternime.",
].join("\n");

function buildContext(user: Awaited<ReturnType<typeof findUserById>>, memories: Awaited<ReturnType<typeof listMemories>>): string {
  const parts: string[] = [];
  if (user) {
    const p: string[] = [];
    if (user.name) p.push(`Nombre: ${user.name}`);
    if (user.tagline) p.push(`Lema: ${user.tagline}`);
    if (user.occupation) p.push(`Ocupación: ${user.occupation}`);
    if (user.birthplace) p.push(`Origen: ${user.birthplace}`);
    if (user.location) p.push(`Vive en: ${user.location}`);
    if (user.bio) p.push(`Biografía: ${user.bio}`);
    if (p.length) parts.push("LO QUE SÉ DE LA PERSONA:\n" + p.join("\n"));
  }
  if (memories.length) {
    const lines = memories.slice(0, 10).map((m, i) => {
      const tone = m.emotional_tone ? ` (${m.emotional_tone})` : "";
      return `${i + 1}. «${m.title}»${tone}: ${m.content ?? ""}`.trim();
    });
    parts.push("SUS RECUERDOS:\n" + lines.join("\n"));
  }
  return parts.join("\n\n") || "Todavía no tiene recuerdos guardados; invítala con calidez a compartir el primero.";
}

export async function POST() {
  try {
    const session = await requireUser();
    const key = process.env.ELEVENLABS_API_KEY || process.env.XI_API_KEY || "";
    const agentId = process.env.ELEVENLABS_EON_AGENT_ID || "";
    if (!key || !agentId) {
      return NextResponse.json({ error: "Eon en tiempo real no está configurado." }, { status: 503 });
    }

    const [user, memories] = await Promise.all([findUserById(session.sub), listMemories(session.sub)]);
    const context = buildContext(user, memories);
    const voiceId = ((user?.prefs as Record<string, unknown> | null)?.eon_voice_id as string | undefined) || DEFAULT_VOICE;
    const firstName = user?.name?.split(" ")[0] || "";

    const signed = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
      { headers: { "xi-api-key": key } },
    );
    if (!signed.ok) {
      return NextResponse.json({ error: "No se pudo abrir la sesión de voz" }, { status: 502 });
    }
    const { signed_url } = (await signed.json()) as { signed_url: string };

    return NextResponse.json({
      signedUrl: signed_url,
      overrides: {
        agent: {
          prompt: { prompt: `${EON_SYSTEM}\n\n${context}` },
          firstMessage: firstName ? `Hola, ${firstName}. Te escucho. ¿Qué traes en mente?` : "Hola. Te escucho. ¿Qué traes en mente?",
          language: "es",
        },
        tts: { voiceId },
      },
      hasMemories: memories.length > 0,
      usingClonedVoice: voiceId !== DEFAULT_VOICE,
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[voice/agent]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
