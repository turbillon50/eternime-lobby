import { NextResponse } from "next/server";
import { loginUser, setSessionCookie } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const rl = rateLimit(`login:${ip}`, 8, 60_000); // 8 intentos por minuto
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Demasiados intentos. Espera un momento e inténtalo de nuevo." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body?.email || !body?.password) {
      return NextResponse.json({ error: "email y password son obligatorios" }, { status: 400 });
    }

    const result = await loginUser({ email: body.email, password: body.password });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await setSessionCookie(result.token);
    return NextResponse.json({ user: result.user });
  } catch (error) {
    console.error("[auth/login]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
