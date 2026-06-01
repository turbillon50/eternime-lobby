/**
 * Clerk webhook — the entry point for tenant creation.
 *
 * On `user.created` we provision the user's private Neon branch (their vault),
 * seed their personality profile, and email a warm welcome. Signature is
 * verified with Svix; the handler is idempotent (safe on Clerk retries).
 *
 * Configure the endpoint in Clerk → Webhooks with `CLERK_WEBHOOK_SECRET`.
 */
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

import { sendWelcomeEmail } from "@/lib/email/resend";
import { provisionTenant } from "@/lib/tenant/provision";

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

function fullName(data: ClerkUserData): string | undefined {
  return [data.first_name, data.last_name].filter(Boolean).join(" ").trim() || undefined;
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  // Verify the Svix signature against the raw body.
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
    // Ack everything else so Clerk stops retrying.
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const email = primaryEmail(event.data);
  if (!email) {
    return NextResponse.json({ error: "No email on user" }, { status: 422 });
  }

  const result = await provisionTenant({
    clerkId: event.data.id,
    email,
    name: fullName(event.data),
  });

  if (result.status === "error") {
    // 500 → Clerk retries with backoff, which is what we want for a transient
    // provisioning failure (the operation is idempotent).
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // First-time provisioning → welcome email (best-effort, never blocks the ack).
  if (event.type === "user.created" && !result.alreadyProvisioned) {
    sendWelcomeEmail(email, fullName(event.data)).catch(() => {});
  }

  return NextResponse.json({ ok: true, branchId: result.branchId });
}
