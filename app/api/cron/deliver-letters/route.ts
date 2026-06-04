import { NextResponse } from "next/server";
import { listDueLetters, markLetterDelivered } from "@/lib/data/letters";
import { sendLetterEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron diario: entrega las cartas programadas cuyo deliver_on ya llegó.
 * Protegido con Authorization: Bearer ${CRON_SECRET} (Vercel cron lo manda solo).
 * Idempotente: solo marca delivered si el envío fue exitoso.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const due = await listDueLetters();
  let sent = 0;
  let failed = 0;
  const results: Array<{ id: string; sent: boolean; error?: string }> = [];

  for (const letter of due) {
    try {
      if (!letter.recipient_email) {
        failed++;
        results.push({ id: letter.id, sent: false, error: "sin recipient_email" });
        continue;
      }
      const r = await sendLetterEmail({
        to: letter.recipient_email,
        recipientName: letter.recipient_name,
        senderName: letter.sender_name || "alguien que te quiere",
        title: letter.title,
        body: letter.body,
        letterId: letter.id,
      });
      if (r.sent) {
        await markLetterDelivered(letter.id);
        sent++;
        results.push({ id: letter.id, sent: true });
      } else {
        failed++;
        results.push({ id: letter.id, sent: false, error: r.error });
      }
    } catch (err) {
      failed++;
      results.push({
        id: letter.id,
        sent: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({ processed: due.length, sent, failed, results });
}
