import "server-only";
import { getCloneSql, initializeClone } from "@/lib/db/clone";
import { ensureTenantForUser } from "@/lib/tenant/ensure";
import { CloneError } from "./errors";

export function cloneNeedsSetup(error: unknown) {
  return error instanceof CloneError && ["CLONE_NOT_INITIALIZED", "TENANT_UNAVAILABLE"].includes(error.code);
}
/** Only called by an authenticated, explicit save/generate action. GET never provisions. */
export async function ensureCloneReady(session: { clerkId: string; email: string; name: string }) {
  try { await getCloneSql(session.clerkId); return; }
  catch (error) { if (!cloneNeedsSetup(error)) throw error; }
  const tenant = await ensureTenantForUser(session);
  if (tenant.status !== "ready") throw new CloneError("SETUP_UNAVAILABLE", "No pude preparar tu espacio. Reintenta aquí en un momento; tu voz guardada se conserva.");
  await initializeClone(session.clerkId);
}
