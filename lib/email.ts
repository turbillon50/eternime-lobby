/**
 * Cliente Resend vía REST (fetch nativo, sin dependencias).
 * Envía las cartas de legado de Eternime el día señalado.
 *
 * Si no hay RESEND_API_KEY configurada → no-op que loggea y devuelve {sent:false}.
 */

export type SendLetterEmailInput = {
  to: string;
  recipientName: string;
  senderName: string;
  title: string;
  body: string;
  letterId: string;
};

export type SendLetterEmailResult = {
  sent: boolean;
  id?: string;
  error?: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function letterHtml(input: SendLetterEmailInput): string {
  const bodyHtml = escapeHtml(input.body)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px 0;">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background-color:#0a0a0f;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0f;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td align="center" style="padding-bottom:28px;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:6px;color:#e9eef4;text-transform:uppercase;">Eternime</div>
          <div style="height:1px;width:80px;background:#e9eef4;margin:14px auto 0;opacity:0.6;"></div>
        </td></tr>
        <tr><td align="center" style="padding-bottom:24px;">
          <div style="font-family:Georgia,serif;font-size:15px;color:#9a93a8;">Querido(a) ${escapeHtml(input.recipientName)},</div>
          <div style="font-family:Georgia,serif;font-size:14px;color:#6f6880;margin-top:6px;">una carta te ha sido confiada y hoy es su día.</div>
        </td></tr>
        <tr><td style="background:#f7f3ea;border-radius:8px;padding:36px 32px;box-shadow:0 0 40px rgba(255,255,255,0.15);">
          <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#2a2433;margin:0 0 20px 0;font-weight:normal;border-bottom:1px solid #e9eef4;padding-bottom:14px;">${escapeHtml(input.title)}</h1>
          <div style="font-family:Georgia,serif;font-size:16px;line-height:1.7;color:#3a3344;">${bodyHtml}</div>
          <div style="margin-top:28px;font-family:Georgia,serif;font-style:italic;color:#6f6880;font-size:15px;">— ${escapeHtml(input.senderName)}</div>
        </td></tr>
        <tr><td align="center" style="padding-top:28px;">
          <div style="font-family:Georgia,serif;font-size:12px;color:#6f6880;line-height:1.6;">
            Esta carta fue confiada a Eternime por ${escapeHtml(input.senderName)} para ser entregada hoy.<br/>
            <a href="https://eternime.org" style="color:#e9eef4;text-decoration:none;">eternime.org</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendLetterEmail(input: SendLetterEmailInput): Promise<SendLetterEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email] RESEND_API_KEY ausente — carta ${input.letterId} no enviada (no-op).`);
    return { sent: false, error: "RESEND_API_KEY no configurada" };
  }

  const from =
    process.env.EON_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    "Eternime <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: `Una carta para ti: ${input.title}`,
        html: letterHtml(input),
        headers: { "X-Entity-Ref-ID": input.letterId },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[email] Resend ${res.status} para carta ${input.letterId}: ${text}`);
      return { sent: false, error: `Resend ${res.status}: ${text}` };
    }

    const data = (await res.json()) as { id?: string };
    return { sent: true, id: data.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[email] Error enviando carta ${input.letterId}: ${msg}`);
    return { sent: false, error: msg };
  }
}
