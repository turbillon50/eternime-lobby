import Link from "next/link";
import { getSession } from "@/lib/auth";
import { countMemories, listMemories } from "@/lib/data/memories";
import { countLetters } from "@/lib/data/letters";
import { countBeneficiaries } from "@/lib/data/beneficiaries";
import { FadeInOnScroll, HoverCard, NumberCounter, StaggerContainer, StaggerItem } from "@/components/motion";
import { Badge, Card, CardDescription, CardTitle, EmptyState } from "@/components/ui";
import { EternityProgress } from "@/components/app/EternityProgress";

export const dynamic = "force-dynamic";

/** Nivel de eternidad: cuánto del legado está preservado (heurística suave). */
function eternityLevel(memories: number, letters: number, beneficiaries: number): { percent: number; label: string } {
  const score = Math.min(60, memories * 6) + Math.min(25, letters * 8) + Math.min(15, beneficiaries * 5);
  const percent = Math.min(100, Math.round(score));
  const label =
    percent === 0
      ? "Tu eternidad comienza con un solo recuerdo."
      : percent < 30
        ? "Tu legado empieza a tomar forma. Sigue preservando."
        : percent < 60
          ? "Tu historia ya tiene voz propia. Vas muy bien."
          : percent < 90
            ? "Tu legado está casi completo — quienes amas te encontrarán aquí."
            : "Tu eternidad está preservada. Cada palabra tuya vivirá.";
  return { percent, label };
}

export default async function AppHomePage() {
  const session = await getSession();
  const userId = session?.sub ?? "";
  const [memories, letters, beneficiaries, recentMemories] = userId
    ? await Promise.all([
        countMemories(userId),
        countLetters(userId),
        countBeneficiaries(userId),
        listMemories(userId),
      ])
    : [0, 0, 0, []];

  const lastThree = recentMemories.slice(0, 3);
  const level = eternityLevel(memories, letters, beneficiaries);

  const stats = [
    { label: "Recuerdos preservados", value: memories, href: "/app/recuerdos" },
    { label: "Cartas de legado", value: letters, href: "/app/cartas" },
    { label: "Beneficiarios", value: beneficiaries, href: "/app/beneficiarios" },
  ];

  return (
    <div className="grid gap-8">
      <FadeInOnScroll>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--et-text-faint)]">Tu legado</p>
        <h1 className="et-serif mt-1 text-3xl text-[var(--et-text)]">
          Hola{session?.name ? `, ${session.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--et-text-muted)]">
          Cada recuerdo que guardas hoy es una conversación que tendrás mañana con quienes amas.
        </p>
      </FadeInOnScroll>

      <StaggerContainer className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <StaggerItem key={stat.label}>
            <Link href={stat.href} className="block h-full">
              <HoverCard className="h-full">
                <Card className="h-full">
                  <NumberCounter value={stat.value} className="et-serif text-4xl text-[var(--et-gold-bright)]" />
                  <CardDescription className="mt-2">{stat.label}</CardDescription>
                </Card>
              </HoverCard>
            </Link>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <FadeInOnScroll delay={0.1}>
        <Card>
          <EternityProgress percent={level.percent} label={level.label} />
        </Card>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.15}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="et-serif text-xl text-[var(--et-text)]">Tus últimos recuerdos</h2>
          {lastThree.length > 0 ? (
            <Link
              href="/app/recuerdos"
              className="text-xs uppercase tracking-[0.14em] text-[var(--et-gold)] transition hover:text-[var(--et-gold-bright)]"
            >
              Ver todos
            </Link>
          ) : null}
        </div>
        {lastThree.length === 0 ? (
          <EmptyState
            title="Tu primer recuerdo te espera"
            description="Empieza hoy: un momento, una voz, una historia. Tu guía aprenderá de cada palabra."
            action={
              <Link href="/app/recuerdos" className="et-btn et-btn-primary">
                Preservar un recuerdo hoy
              </Link>
            }
          />
        ) : (
          <StaggerContainer className="grid gap-4 sm:grid-cols-3">
            {lastThree.map((memory) => (
              <StaggerItem key={memory.id}>
                <Card className="flex h-full flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle>{memory.title}</CardTitle>
                    <Badge tone="muted">{memory.kind}</Badge>
                  </div>
                  {memory.content ? (
                    <CardDescription className="line-clamp-2">{memory.content}</CardDescription>
                  ) : null}
                  {memory.emotional_tone ? (
                    <div className="mt-auto pt-1">
                      <Badge>{memory.emotional_tone}</Badge>
                    </div>
                  ) : null}
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </FadeInOnScroll>

      {lastThree.length > 0 ? (
        <FadeInOnScroll delay={0.2}>
          <Card className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle>Preservar un recuerdo hoy</CardTitle>
              <CardDescription className="mt-1">
                Un minuto tuyo de hoy puede ser un tesoro para alguien dentro de veinte años.
              </CardDescription>
            </div>
            <Link href="/app/recuerdos" className="et-btn et-btn-primary shrink-0">
              Preservar ahora
            </Link>
          </Card>
        </FadeInOnScroll>
      ) : null}
    </div>
  );
}
