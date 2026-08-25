import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireUser, AuthError } from "@/lib/auth";
import { getControlDb, controlSchema } from "@/lib/db/control";
import { stripePost } from "@/lib/stripe";

export const runtime = "nodejs";

/** Compra de paquetes del programa: Socio $50,000 MXN (20%) / Master $100,000 MXN (40%). */
export async function POST(request: NextRequest) {
  try {
    const session = await requireUser();
    const db = getControlDb();

    let [u] = await db
      .select()
      .from(controlSchema.users)
      .where(eq(controlSchema.users.clerkId, session.clerkId))
      .limit(1);
    if (!u) {
      [u] = await db
        .insert(controlSchema.users)
        .values({ clerkId: session.clerkId, email: session.email, name: session.name })
        .returning();
    }

    let paquete = "socio";
    try {
      const body = (await request.json()) as { paquete?: string };
      if (body?.paquete === "master") paquete = "master";
    } catch {
      // sin body → socio
    }

    const price = paquete === "master" ? process.env.STRIPE_PRICE_MASTER : process.env.STRIPE_PRICE_SOCIO;
    if (!price) return NextResponse.json({ error: "Paquete no configurado." }, { status: 500 });

    const base = process.env.NEXT_PUBLIC_APP_URL || "https://eternime.org";
    const co = await stripePost("/checkout/sessions", {
      mode: "payment",
      "line_items[0][price]": price,
      "line_items[0][quantity]": "1",
      client_reference_id: u.id,
      customer_email: session.email,
      success_url: `${base}/app/socio?activacion=ok`,
      cancel_url: `${base}/app/socio`,
      "metadata[clerk_id]": session.clerkId,
      "metadata[paquete]": paquete,
    });

    return NextResponse.json({ url: co.url });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message, url: "/crear" }, { status: e.status });
    }
    console.error("[checkout socio]", e);
    return NextResponse.json({ error: "No se pudo iniciar el pago." }, { status: 500 });
  }
}
