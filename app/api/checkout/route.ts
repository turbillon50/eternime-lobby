import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireUser, AuthError } from "@/lib/auth";
import { getControlDb, controlSchema } from "@/lib/db/control";
import { stripePost } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST() {
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

    const price = process.env.STRIPE_PRICE_LEGADO;
    if (!price) return NextResponse.json({ error: "Precio no configurado." }, { status: 500 });

    const base = process.env.NEXT_PUBLIC_APP_URL || "https://eternime.org";
    const co = await stripePost("/checkout/sessions", {
      mode: "subscription",
      "line_items[0][price]": price,
      "line_items[0][quantity]": "1",
      client_reference_id: u.id,
      customer_email: session.email,
      success_url: `${base}/app?suscripcion=activa`,
      cancel_url: `${base}/precios`,
      allow_promotion_codes: "true",
      "metadata[clerk_id]": session.clerkId,
      "subscription_data[metadata][control_user_id]": u.id,
    });

    return NextResponse.json({ url: co.url });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message, url: "/crear" }, { status: e.status });
    }
    console.error("[checkout]", e);
    return NextResponse.json({ error: "No se pudo iniciar el pago." }, { status: 500 });
  }
}
