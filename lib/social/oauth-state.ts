/**
 * Estado anti-CSRF para los flujos OAuth de Facebook/Instagram. Un nonce
 * aleatorio se guarda en una cookie httpOnly de corta duracion al iniciar el
 * flujo (/connect) y se compara contra el `state` que Meta regresa en el
 * callback. Si no coinciden, se rechaza — protege contra que alguien fuerce
 * a un usuario a conectar la cuenta de Meta de un atacante.
 */
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";

function cookieName(provider: string): string {
  return `et_oauth_state_${provider}`;
}

export async function createOauthState(provider: string): Promise<string> {
  const nonce = randomBytes(16).toString("hex");
  const store = await cookies();
  store.set(cookieName(provider), nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60, // 10 minutos — tiempo de sobra para completar el dialogo de Meta
  });
  return nonce;
}

export async function verifyOauthState(provider: string, receivedState: string | null): Promise<boolean> {
  if (!receivedState) return false;
  const store = await cookies();
  const expected = store.get(cookieName(provider))?.value;
  store.set(cookieName(provider), "", { path: "/", maxAge: 0 });
  return Boolean(expected) && expected === receivedState;
}
