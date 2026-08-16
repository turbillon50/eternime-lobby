import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { put } from "@vercel/blob";
import { findUserByPhone } from "@/lib/data/users";
import { createFile, kindFromMime } from "@/lib/data/files";
import { createMemory } from "@/lib/data/memories";
import type { MemoryKind } from "@/lib/data/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Ingesta por WhatsApp (webhook de Twilio). El usuario manda una foto, un
 * video, un audio o un texto por WhatsApp al número de Eternime y queda
 * guardado en su Bóveda / recuerdos (source=whatsapp).
 *
 * Seguridad: valida X-Twilio-Signature con TWILIO_AUTH_TOKEN. El remitente se
 * mapea contra eternime_users.phone (por los últimos 10 dígitos). Si el número
 * no está registrado, responde pidiendo que lo agregue en su perfil.
 *
 * Env necesarias (inyectadas en Vercel): TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
 * TWILIO_PHONE. Opcional: TWILIO_WEBHOOK_URL (si la URL pública difiere del host).
 */

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function twiml(message: string): NextResponse {
  const body = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${xmlEscape(message)}</Message></Response>`;
  return new NextResponse(body, { status: 200, headers: { "Content-Type": "text/xml; charset=utf-8" } });
}

/** Firma de Twilio: URL + (key+value ordenados por key), HMAC-SHA1, base64. */
function validateSignature(authToken: string, url: string, params: Record<string, string>, signature: string): boolean {
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
  const expected = crypto.createHmac("sha1", authToken).update(Buffer.from(data, "utf-8")).digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

function kindForWhatsapp(mime: string): MemoryKind {
  if (mime.startsWith("image/")) return "foto";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "voz";
  return "texto";
}

export async function POST(request: Request) {
  const authToken = process.env.TWILIO_AUTH_TOKEN || "";
  const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
  if (!authToken || !accountSid) {
    return new NextResponse("WhatsApp no configurado", { status: 503 });
  }

  const raw = await request.text();
  const params: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(raw)) params[k] = v;

  // URL pública que Twilio firmó.
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const publicUrl = process.env.TWILIO_WEBHOOK_URL || `${proto}://${host}${new URL(request.url).pathname}`;

  const signature = request.headers.get("x-twilio-signature") || "";
  if (!validateSignature(authToken, publicUrl, params, signature)) {
    return new NextResponse("Firma inválida", { status: 403 });
  }

  const from = (params.From || "").replace(/^whatsapp:/, "").trim();
  const body = (params.Body || "").trim();
  const numMedia = parseInt(params.NumMedia || "0", 10) || 0;

  const user = await findUserByPhone(from);
  if (!user) {
    return twiml(
      "No reconozco este número todavía. Entra a Eternime, ve a tu Perfil y agrega este número de teléfono para poder guardar aquí lo que me mandes por WhatsApp.",
    );
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  let savedFiles = 0;

  if (token && numMedia > 0) {
    const basic = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    for (let i = 0; i < numMedia; i++) {
      const mediaUrl = params[`MediaUrl${i}`];
      const mime = params[`MediaContentType${i}`] || "application/octet-stream";
      if (!mediaUrl) continue;
      try {
        const res = await fetch(mediaUrl, { headers: { Authorization: `Basic ${basic}` } });
        if (!res.ok) continue;
        const buf = Buffer.from(await res.arrayBuffer());
        const ext = mime.split("/")[1]?.split(";")[0] || "bin";
        const pathname = `eternime/${user.id}/whatsapp/${Date.now()}-${i}.${ext}`;
        const blob = await put(pathname, buf, { access: "public", token, contentType: mime });
        await createFile({
          userId: user.id,
          kind: kindFromMime(mime),
          url: blob.url,
          pathname: blob.pathname,
          name: `whatsapp-${Date.now()}-${i}.${ext}`,
          mime,
          size: buf.length,
          caption: body || null,
        });
        await createMemory({
          userId: user.id,
          title: body || "Recuerdo por WhatsApp",
          content: body || null,
          kind: kindForWhatsapp(mime),
          mediaUrl: blob.url,
          source: "whatsapp",
        });
        savedFiles++;
      } catch (e) {
        console.error("[whatsapp] media", e);
      }
    }
  }

  // Texto sin media → recuerdo de texto.
  if (numMedia === 0 && body) {
    await createMemory({
      userId: user.id,
      title: "Nota por WhatsApp",
      content: body,
      kind: "texto",
      source: "whatsapp",
    });
  }

  const firstName = user.name?.split(" ")[0] || "";
  const saludo = firstName ? `Listo, ${firstName}.` : "Listo.";
  if (savedFiles > 0) {
    return twiml(`${saludo} Guardé ${savedFiles} ${savedFiles === 1 ? "archivo" : "archivos"} en tu memoria de Eternime.`);
  }
  if (body) {
    return twiml(`${saludo} Guardé tu nota en Eternime.`);
  }
  return twiml(`${saludo} Mándame una foto, un audio, un video o un texto y lo guardo en tu memoria.`);
}
