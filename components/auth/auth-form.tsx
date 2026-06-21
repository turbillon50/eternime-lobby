"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { FadeInOnScroll } from "@/components/motion";
import { Button, Card, Input } from "@/components/ui";

type Mode = "login" | "register";

const copy: Record<Mode, { title: string; subtitle: string; cta: string; alt: string; altHref: string; altCta: string }> = {
  login: {
    title: "Bienvenido de vuelta",
    subtitle: "Tu legado te estaba esperando.",
    cta: "Entrar",
    alt: "¿Aún no tienes cuenta?",
    altHref: "/crear",
    altCta: "Crear mi legado",
  },
  register: {
    title: "Crea tu legado",
    subtitle: "Cada vida deja una huella. Empieza a preservar la tuya.",
    cta: "Comenzar",
    alt: "¿Ya tienes cuenta?",
    altHref: "/entrar",
    altCta: "Entrar",
  },
};

function AuthFormInner({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const c = copy[mode];

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "login" ? { email, password } : { name, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Algo salió mal. Intenta de nuevo.");
        return;
      }
      router.push(mode === "register" ? "/app/perfil?welcome=1" : (params.get("next") ?? "/app"));
      router.refresh();
    } catch {
      setError("No pudimos conectar. Revisa tu red e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-10">
      <FadeInOnScroll className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="et-glow-ring et-pulse mx-auto mb-6 h-16 w-16 rounded-full" />
          <h1 className="et-serif text-3xl text-[var(--et-text)]">{c.title}</h1>
          <p className="mt-2 text-sm text-[var(--et-text-muted)]">{c.subtitle}</p>
        </div>
        <Card>
          <form onSubmit={onSubmit} className="grid gap-4">
            {mode === "register" ? (
              <Input
                label="Tu nombre"
                placeholder="¿Cómo te llamas?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            ) : null}
            <Input
              label="Correo"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder={mode === "register" ? "Mínimo 8 caracteres" : "Tu contraseña"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              minLength={8}
              required
            />
            {error ? <p className="text-sm text-[var(--et-danger)]">{error}</p> : null}
            <Button type="submit" loading={loading} className="mt-1 w-full">
              {c.cta}
            </Button>
          </form>
        </Card>
        <p className="mt-6 text-center text-sm text-[var(--et-text-muted)]">
          {c.alt}{" "}
          <Link href={c.altHref} className="text-[var(--et-gold-bright)] underline-offset-4 hover:underline">
            {c.altCta}
          </Link>
        </p>
      </FadeInOnScroll>
    </div>
  );
}

export function AuthForm({ mode }: { mode: Mode }) {
  return (
    <Suspense fallback={null}>
      <AuthFormInner mode={mode} />
    </Suspense>
  );
}
