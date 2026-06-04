/**
 * On-demand tenant provisioning (fallback path, per spec:
 * "Si tenant_db_url falla → crear branch on-demand como fallback").
 *
 * The Clerk webhook is the primary trigger, but it requires a registered
 * endpoint. This route lets the onboarding loader provision the signed-in
 * user's vault directly, so the experience works end-to-end even if the webhook
 * hasn't fired yet. It is idempotent — `provisionTenant` no-ops once ready.
 */
import { NextResponse } from "next/server";

import { isClerkConfigured } from "@/lib/clerk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  if (!isClerkConfigured()) {
    return NextResponse.json({ status: "ready", demo: true });
  }

  const { currentUser } = await import("@clerk/nextjs/server");
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ status: "unauthenticated" }, { status: 401 });
  }

  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    null;
  if (!email) {
    return NextResponse.json({ status: "error", error: "No email on account" }, { status: 422 });
  }

  const { provisionTenant } = await import("@/lib/tenant/provision");
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || undefined;

  const result = await provisionTenant({ clerkId: user.id, email, name });

  if (result.status === "error") {
    return NextResponse.json({ status: "error", error: result.error }, { status: 500 });
  }
  return NextResponse.json({ status: "ready", branchId: result.branchId });
}
