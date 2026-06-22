import Link from "next/link";
import { getSession } from "@/lib/auth";
import { translate } from "@/lib/i18n";
import { getServerLang } from "@/lib/i18n-server";
import { countMemories, listMemories } from "@/lib/data/memories";
import { countLetters, nextScheduledLetter } from "@/lib/data/letters";
import { countBeneficiaries } from "@/lib/data/beneficiaries";
import { findUserById } from "@/lib/data/users";
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
  const lang = await getServerLang();
  const T = (k: string) => translate(lang, k as never);
  const userId = session?.sub ?? "";
  const [memories, letters, beneficiaries, recentMemories, user, nextLetter] = userId
    ? await Promise.all([
        countMemories(userId),
        countLetters(userId),
        countBeneficiaries(userId),
        listMemories(userId),
        findUserById(userId),
        nextScheduledLetter(userId),
      ])
    : ([0, 0, 0, [], null, null] as const);

  const legacyDays = user?.created_at
    ? Math.max(1, Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000) + 1)
    : 1;
  const daysToDelivery = nextLetter?.deliver_on
    ? Math.max(0, Math.ceil((new Date(nextLetter.deliver_on).getTime() - Date.now()) / 86400000))
    : null;

  const lastThree = recentMemories.slice(0, 3);
  const level = eternityLevel(memories, letters, beneficiaries);

  const stats = [
    { label: T("dash.memories"), value: memories, href: "/app/recuerdos" },
    { label: T("dash.letters"), value: letters, href: "/app/cartas" },
    { label: T("dash.heirs"), value: beneficiaries, href: "/app/beneficiarios" },
    { label: T("dash.days"), value: legacyDays, href: "/app/perfil" },
  ];

  return (
    <div className="grid gap-8">
      <FadeInOnScroll>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--et-text-faint)]">{T("dash.eyebrow")}</p>
        <h1 className="et-serif mt-1 text-3xl text-[var(--et-text)]">
          {T("dash.greeting")}{session?.name ? `, ${session.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--et-text-muted)]">
          {T("dash.sub")}
        </p>
      </FadeInOnScroll>

      <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {nextLetter ? (
        <FadeInOnScroll delay={0.12}>
          <Card className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--et-gold)]">Próxima carta programada</p>
              <CardTitle className="mt-1">{nextLetter.title}</CardTitle>
              <CardDescription className="mt-1">
                Para {nextLetter.recipient_name}
                {daysToDelivery !== null
                  ? daysToDelivery === 0
                    ? " — se entrega hoy"
                    : ` — se entrega en ${daysToDelivery} ${daysToDelivery === 1 ? "día" : "días"}`
                  : ""}
              </CardDescription>
            </div>
            <Link href="/app/cartas" className="et-btn et-btn-ghost shrink-0">
              Ver cartas
            </Link>
          </Card>
        </FadeInOnScroll>
      ) : null}

      <FadeInOnScroll delay={0.15}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="et-serif text-xl text-[var(--et-text)]">{T("dash.recent")}</h2>
          {lastThree.length > 0 ? (
            <Link
              href="/app/recuerdos"
              className="text-xs uppercase tracking-[0.14em] text-[var(--et-gold)] transition hover:text-[var(--et-gold-bright)]"
            >
              {T("dash.seeAll")}
            </Link>
          ) : null}
        </div>
        {lastThree.length === 0 ? (
          <EmptyState
            title={T("vault.emptyTitle")}
            description="Empieza hoy: un momento, una voz, una historia. Tu guía aprenderá de cada palabra."
            action={
              <Link href="/app/recuerdos" className="et-btn et-btn-primary">
                {T("dash.preserveNow")}
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
              <CardTitle>{T("dash.preserveTitle")}</CardTitle>
              <CardDescription className="mt-1">
                {T("dash.preserveSub")}
              </CardDescription>
            </div>
            <Link href="/app/recuerdos" className="et-btn et-btn-primary shrink-0">
              {T("dash.preserveNow")}
            </Link>
          </Card>
        </FadeInOnScroll>
      ) : null}
    </div>
  );
}
