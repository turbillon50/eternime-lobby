/**
 * Clerk webhook — sincroniza altas/cambios de usuarios de Clerk con la tabla
 * local eternime_users (vía clerk_id). Firma verificada con Svix; idempotente
 * (seguro ante reintentos de Clerk).
 *
 * NOTA HISTORICA: este webhook antes llamaba a provisionTenant() para crear
 * una rama de Neon por usuario (arquitectura multi-tenant abandonada). La app
 * hoy usa una sola base compartida (eternime_users + tablas relacionadas);
 * el alta real ya no necesita aprovisionar nada, solo sincronizar la fila.
 *
 * Configurar el endpoint en Clerk → Webhooks con CLERK_WEBHOOK_SECRET.
 */
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

import { sendWelcomeEmail } from "@/lib/email/resend";
import { upsertUserFromClerk, findUserByClerkId } from "@/lib/data/users";

export const runtime = "nodejs";

interface ClerkEmailAddress {
  id: string;
  email_address: string;
}

interface ClerkUserData {
  id: string;
  email_addresses?: ClerkEmailAddress[];
  primary_email_address_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
}

interface ClerkWebhookEvent {
  type: string;
  data: ClerkUserData;
}

function primaryEmail(data: ClerkUserData): string | null {
  const list = data.email_addresses ?? [];
  const primary = list.find((e) => e.id === data.primary_email_address_id);
  return primary?.email_address ?? list[0]?.email_address ?? null;
}

function fullName(data: ClerkUserData): string {
  return (
    [data.first_name, data.last_name].filter(Boolean).join(" ").trim() ||
    data.username ||
    ""
  );
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const headerList = await headers();
  const svixId = headerList.get("svix-id");
  const svixTimestamp = headerList.get("svix-timestamp");
  const svixSignature = headerList.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing Svix headers" }, { status: 400 });
  }

  const payload = await req.text();
  let event: ClerkWebhookEvent;
  try {
    event = new Webhook(secret).verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "user.created" && event.type !== "user.updated") {
    // Ack todo lo demas para que Clerk deje de reintentar.
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const email = primaryEmail(event.data);
  if (!email) {
    return NextResponse.json({ error: "No email on user" }, { status: 422 });
  }

  const wasAlreadySynced = Boolean(await findUserByClerkId(event.data.id));

  const local = await upsertUserFromClerk({
    clerkId: event.data.id,
    email,
    name: fullName(event.data),
  });

  if (!local) {
    // 500 → Clerk reintenta con backoff; la operacion es idempotente.
    return NextResponse.json({ error: "No se pudo sincronizar el usuario" }, { status: 500 });
  }

  if (event.type === "user.created" && !wasAlreadySynced) {
    sendWelcomeEmail(email, local.name).catch(() => {});
  }

  return NextResponse.json({ ok: true, userId: local.id });
}
