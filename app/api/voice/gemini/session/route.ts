import { GoogleGenAI, Modality } from "@google/genai";
import { NextResponse } from "next/server";

import { AuthError, requireUser } from "@/lib/auth";
import { backfillMissingMemoryEmbeddings } from "@/lib/ai/rag";
import { EON_LIVE_TOOLS } from "@/lib/voice/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = process.env.GEMINI_LIVE_MODEL || "gemini-3.1-flash-live-preview";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({})) as { freeTierConsent?: boolean };
    if (body.freeTierConsent !== true) {
      return NextResponse.json({ error: "Necesitamos tu autorización para iniciar la beta de voz." }, { status: 400 });
    }
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Gemini Live no está configurado." }, { status: 503 });

    // Repara un lote histórico antes de abrir la sesión; nunca bloquea la voz si Gemini Embeddings falla.
    await backfillMissingMemoryEmbeddings(user.sub, 3).catch(() => null);

    const systemInstruction = `Eres Eon, la memoria viva privada de ${user.name || "esta persona"}. Hablas español natural de México, cálido, breve y ágil. No eres un bot de soporte. Puedes ser interrumpido y debes parar inmediatamente cuando la persona vuelva a hablar.

REGLAS DE MEMORIA Y ACCIÓN:
- Nunca inventes recuerdos. Usa memory_search antes de afirmar que recuerdas un dato personal.
- Sólo usa memory_save cuando la persona diga explícitamente guarda, recuerda, anota o equivalente.
- Puedes consultar y crear pendientes o proyectos cuando lo pidan claramente.
- No puedes borrar nada. El borrado sólo ocurre dentro de la app con doble verificación.
- Para acciones externas, primero usa integrations_status. Antes de crear un borrador, repite destinatario, asunto y propósito y pide un sí explícito. email_draft_create jamás envía.
- Después de una herramienta, confirma en una frase qué ocurrió. Si falla, dilo claramente y ofrece el paso concreto para resolverlo.
- No leas identificadores técnicos, JSON ni puntajes en voz alta.`;

    const config = {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        languageCode: "es-MX",
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
      },
      systemInstruction,
      tools: [{ functionDeclarations: [...EON_LIVE_TOOLS] }],
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    };
    const now = Date.now();
    // Los tokens efímeros de Gemini Live sólo son compatibles con v1beta.
    const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1beta" } });
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        newSessionExpireTime: new Date(now + 60_000).toISOString(),
        expireTime: new Date(now + 30 * 60_000).toISOString(),
        liveConnectConstraints: { model: MODEL, config },
      },
    });
    if (!token.name) throw new Error("Gemini no devolvió un token temporal.");
    return NextResponse.json(
      { token: token.name, model: MODEL, config },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("[voice/gemini/session]", error);
    return NextResponse.json({ error: "No se pudo abrir la voz de Eon." }, { status: 502 });
  }
}
