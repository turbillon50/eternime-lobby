import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { getBeneficiary, updateBeneficiary } from "@/lib/data/beneficiaries";
import { findUserById } from "@/lib/data/users";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await params;
    const heir = await getBeneficiary(id, session.sub);
    if (!heir) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    if (!heir.email) return NextResponse.json({ error: "Este heredero no tiene correo" }, { status: 400 });

    const key = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL || "Eternime <hola@eternime.org>";
    if (!key) return NextResponse.json({ error: "Correo no configurado" }, { status: 503 });

    const owner = await findUserById(session.sub);
    const ownerName = owner?.name || "Alguien que te quiere";
    const html = `<!DOCTYPE html><html lang="es"><body style="margin:0;background:#0a0a0f;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 16px;"><tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr><td align="center" style="padding-bottom:24px;">
            <div style="font-family:Georgia,serif;font-size:22px;letter-spacing:6px;color:#e9eef4;text-transform:uppercase;">Eternime</div>
            <div style="height:1px;width:80px;background:#ffffff;opacity:.5;margin:14px auto 0;"></div>
          </td></tr>
          <tr><td style="background:#12121a;border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:36px 32px;">
            <p style="font-family:Georgia,serif;font-size:17px;color:#f5f2ea;margin:0 0 16px;">Querido(a) ${heir.name},</p>
            <p style="font-family:Georgia,serif;font-size:15px;line-height:1.7;color:#c7c2d4;margin:0 0 16px;">
              ${ownerName} te ha nombrado <strong>heredero(a) de su legado</strong> en Eternime: recuerdos, cartas y su memoria, guardados para llegar a ti cuando sea el momento.
            </p>
            <p style="font-family:Georgia,serif;font-size:15px;line-height:1.7;color:#c7c2d4;margin:0 0 24px;">
              No tienes que hacer nada ahora. Solo queríamos que lo supieras: alguien quiso que su historia viviera en ti.
            </p>
            <a href="https://eternime.org" style="display:inline-block;background:linear-gradient(135deg,#e9eef4,#ffffff);color:#0a0a0f;text-decoration:none;font-family:system-ui,sans-serif;font-size:14px;padding:12px 22px;border-radius:999px;">Conocer Eternime</a>
          </td></tr>
          <tr><td align="center" style="padding-top:24px;">
            <div style="font-family:Georgia,serif;font-size:12px;color:#6f6880;">Confiado a Eternime por ${ownerName}. <a href="https://eternime.org" style="color:#e9eef4;text-decoration:none;">eternime.org</a></div>
          </td></tr>
        </table>
      </td></tr></table></body></html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: heir.email, subject: `${ownerName} te ha nombrado heredero(a) en Eternime`, html }),
    });
    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json({ error: "No se pudo enviar", detail: t.slice(0, 200) }, { status: 502 });
    }
    await updateBeneficiary(id, session.sub, { invitedAt: new Date().toISOString() });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[heir invite]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
