import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { appendGuideMessages } from "@/lib/data/guide";
import { createMemory, countConversationMemories } from "@/lib/data/memories";
import { refreshPersonalitySummary } from "@/lib/ai/eon";
import { storeMemoryEmbedding } from "@/lib/ai/rag";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BODY_BYTES = 200 * 1024; // 200KB — corta payloads explosivos
const MAX_TURNS = 200;
const MAX_TURN_LENGTH = 2000;
const MIN_CAPTURABLE_LENGTH = 40;
const PERSONALITY_REFRESH_EVERY = 5;

type Turn = { role: "user" | "assistant"; content: string };

function sanitizeTurns(raw: unknown): Turn[] {
  if (!Array.isArray(raw)) return [];
  const turns: Turn[] = [];
  for (const t of raw.slice(0, MAX_TURNS)) {
    if (!t || typeof t !== "object") continue;
    const role = (t as { role?: unknown }).role;
    const content = (t as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") continue;
    if (typeof content !== "string") continue;
    const clean = content.trim().slice(0, MAX_TURN_LENGTH);
    if (!clean) continue;
    turns.push({ role, content: clean });
  }
  return turns;
}

/**
 * POST { turns: [{ role, content }] }
 * Persiste una conversación de voz con Eon: cada turno queda en el historial
 * de la guía, y lo que la persona contó se captura como recuerdo con
 * embedding para que Eon lo recuerde en futuras conversaciones (texto o voz).
 */
export async function POST(request: Request) {
  try {
    const session = await requireUser();

    // Límite de tamaño del cuerpo (200KB) antes de parsear — protege memoria.
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf-8") > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Payload demasiado grande" }, { status: 413 });
    }
    let parsed: { turns?: unknown } = {};
    try { parsed = raw ? JSON.parse(raw) : {}; } catch { parsed = {}; }
    const turns = sanitizeTurns(parsed.turns);
    if (!turns.length) {
      return NextResponse.json({ saved: 0, captured: 0 });
    }

    // Historial de la guía: un solo INSERT masivo (evita N+1).
    let saved = 0;
    try {
      saved = await appendGuideMessages(session.sub, turns);
    } catch (e) {
      console.error("[voice/transcript] append failed:", e instanceof Error ? e.message : e);
    }

    // Lo que la persona dijo (unido) se preserva como recuerdo de conversación.
    let captured = 0;
    const userText = turns
      .filter((t) => t.role === "user")
      .map((t) => t.content)
      .join("\n")
      .trim();
    if (userText.length >= MIN_CAPTURABLE_LENGTH) {
      try {
        const title =
          userText.length > 60 ? userText.slice(0, 57) + "…" : userText;
        const mem = await createMemory({
          userId: session.sub,
          title,
          content: userText,
          kind: "texto",
          source: "conversacion",
        });
        if (mem) {
          captured = 1;
          await storeMemoryEmbedding(mem.id, session.sub, userText);
          const n = await countConversationMemories(session.sub);
          if (n > 0 && n % PERSONALITY_REFRESH_EVERY === 0) {
            await refreshPersonalitySummary(session.sub);
          }
        }
      } catch (e) {
        console.error("[voice/transcript] capture failed:", e instanceof Error ? e.message : e);
      }
    }

    return NextResponse.json({ saved, captured }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[voice/transcript]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
