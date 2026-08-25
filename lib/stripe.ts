import "server-only";
import crypto from "node:crypto";

const STRIPE_API = "https://api.stripe.com/v1";

function stripeKey() {
  const k = process.env.STRIPE_SECRET_KEY;
  if (!k) throw new Error("Falta STRIPE_SECRET_KEY");
  return k;
}

export async function stripePost(path: string, params: Record<string, string>) {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  });
  const data = (await res.json()) as { url?: string; id?: string; error?: { message?: string } };
  if (!res.ok) throw new Error(`Stripe ${path} ${res.status}: ${data.error?.message ?? "error"}`);
  return data;
}

/** Verifica la firma del webhook de Stripe (esquema t=...,v1=...) sin SDK. */
export function verifyStripeSignature(rawBody: string, header: string | null, secret: string, toleranceSec = 300) {
  if (!header) return false;
  let t = 0;
  const sigs: string[] = [];
  for (const parte of header.split(",")) {
    const i = parte.indexOf("=");
    if (i < 0) continue;
    const k = parte.slice(0, i).trim();
    const v = parte.slice(i + 1).trim();
    if (k === "t") t = Number(v);
    else if (k === "v1") sigs.push(v);
  }
  if (!t || sigs.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const esperado = crypto.createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  return sigs.some((sig) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(sig));
    } catch {
      return false;
    }
  });
}
