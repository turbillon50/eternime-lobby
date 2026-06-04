/**
 * Onboarding status poll. The cinematic loader hits this until the user's
 * tenant branch finishes provisioning (status === "ready").
 */
import { NextResponse } from "next/server";

import { isClerkConfigured } from "@/lib/clerk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isClerkConfigured()) {
    // Demo mode: pretend the vault is instantly ready.
    return NextResponse.json({ status: "ready", demo: true });
  }

  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ status: "unauthenticated" }, { status: 401 });
  }

  const { getControlDb } = await import("@/lib/db/control");
  const { users } = await import("@/lib/db/schema/control-plane");
  const { eq } = await import("drizzle-orm");

  const [row] = await getControlDb()
    .select({ status: users.status })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  // No row yet → the webhook hasn't landed; treat as still provisioning.
  return NextResponse.json({ status: row?.status ?? "provisioning" });
}
