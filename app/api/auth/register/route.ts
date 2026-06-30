import { NextResponse } from "next/server";
import { registerUser, setSessionCookie } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const rl = rateLimit(`register:${ip}`, 5, 60_000); // 5 registros por minuto por IP
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Demasiados intentos. Espera un momento e inténtalo de nuevo." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body?.email || !body?.password || !body?.name) {
      return NextResponse.json({ error: "email, password y name son obligatorios" }, { status: 400 });
    }

    const result = await registerUser({ email: body.email, password: body.password, name: body.name, inviteCode: body.inviteCode });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await setSessionCookie(result.token);
    return NextResponse.json({ user: result.user }, { status: 201 });
  } catch (error) {
    console.error("[auth/register]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
