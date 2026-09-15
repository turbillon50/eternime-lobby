import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { initializeClone } from "@/lib/db/clone";
import { cloneSnapshot, saveCloneFact } from "@/lib/data/clone";
import { isCloneTopic } from "@/lib/clone/profile";
import { cloneErrorResponse, PRIVATE_HEADERS } from "@/lib/clone/http";
import { ensureTenantForUser } from "@/lib/tenant/ensure";
import { CloneError } from "@/lib/clone/errors";

import { boundedJson, sameOrigin } from "@/lib/clone/guard";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  try {
    const session = await requireUser();
    return NextResponse.json(await cloneSnapshot(session.clerkId), { headers: PRIVATE_HEADERS });
  } catch (error) { return cloneErrorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    sameOrigin(request);
    const body = await boundedJson(request);
    if (body?.action !== "initialize" || body?.consent !== true) {
      return NextResponse.json({ error: "Confirma que deseas iniciar la memoria de tu clon." }, { status: 400 });
    }
    const prepared = await ensureTenantForUser(session);
    if (prepared.status !== "ready") throw new CloneError("TENANT_UNAVAILABLE", "No pude preparar tu espacio personal. Intenta de nuevo en unos momentos.");
    await initializeClone(session.clerkId);
    return NextResponse.json(await cloneSnapshot(session.clerkId), { status: 201, headers: PRIVATE_HEADERS });
  } catch (error) { return cloneErrorResponse(error); }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireUser();
    sameOrigin(request);
    const body = await boundedJson(request);
    if (!isCloneTopic(body?.topic) || typeof body.content !== "string" || body.content.length > 3000 ||
        !Number.isSafeInteger(body.revision) || body.revision < 0 || body.confirmed !== true) {
      return NextResponse.json({ error: "Revisa el tema y el texto que quieres confirmar (máximo 3,000 caracteres)." }, { status: 400 });
    }
    await saveCloneFact(session.clerkId, body.topic, body.content.trim(), body.revision);
    return NextResponse.json(await cloneSnapshot(session.clerkId), { headers: PRIVATE_HEADERS });
  } catch (error) { return cloneErrorResponse(error); }
}
