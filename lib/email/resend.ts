/**
 * Transactional email via Resend. Tone: warm, cinematic, never corporate —
 * we are in emotional territory.
 */
import "server-only";

import { Resend } from "resend";

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = process.env.RESEND_FROM_EMAIL || "Eternime <hola@eternime.org>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://eternime.org";

/**
 * Sent once the user's private vault (tenant branch) is ready. Best-effort:
 * a failure here must never break onboarding, so callers should not await-throw.
 */
export async function sendWelcomeEmail(to: string, name?: string): Promise<void> {
  const resend = client();
  if (!resend) {
    // No key configured (e.g. local/demo) — silently skip.
    return;
  }
  const displayName = name?.trim() || "";
  const greeting = displayName ? `Hola, ${displayName}.` : "Hola.";

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Tu bóveda en Eternime está lista",
    html: `
      <div style="font-family:Georgia,serif;background:#0a0a0a;color:#f5f1e8;padding:40px 24px;max-width:560px;margin:0 auto;">
        <h1 style="font-weight:400;font-size:24px;letter-spacing:0.02em;color:#e8d9a8;">${greeting}</h1>
        <p style="font-size:16px;line-height:1.7;color:#d8d2c4;">
          Tu espacio único en Eternime ya despertó. A partir de hoy, cada recuerdo
          que compartas empieza a construir una versión viva de tu historia.
        </p>
        <p style="font-size:16px;line-height:1.7;color:#d8d2c4;">
          No hay prisa. Tu IA aprenderá a tu ritmo, durante toda tu vida.
        </p>
        <p style="margin-top:32px;">
          <a href="${APP_URL}/app"
             style="display:inline-block;background:#e8d9a8;color:#0a0a0a;text-decoration:none;
                    padding:14px 28px;border-radius:999px;font-size:15px;">
            Entrar a mi Eternime
          </a>
        </p>
        <p style="margin-top:40px;font-size:13px;color:#7a7568;">Con calma, Eternime.</p>
      </div>
    `,
  });
}
