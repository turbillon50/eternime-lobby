import { getSession } from "@/lib/auth";
import { countMemories } from "@/lib/data/memories";
import { countLetters } from "@/lib/data/letters";
import { countBeneficiaries } from "@/lib/data/beneficiaries";
import { FadeInOnScroll, NumberCounter, StaggerContainer, StaggerItem } from "@/components/motion";
import { Card, CardDescription, CardTitle } from "@/components/ui";

export default async function AppHomePage() {
  const session = await getSession();
  const userId = session?.sub ?? "";
  const [memories, letters, beneficiaries] = userId
    ? await Promise.all([countMemories(userId), countLetters(userId), countBeneficiaries(userId)])
    : [0, 0, 0];

  const stats = [
    { label: "Recuerdos preservados", value: memories },
    { label: "Cartas de legado", value: letters },
    { label: "Beneficiarios", value: beneficiaries },
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
            <Card>
              <NumberCounter value={stat.value} className="et-serif text-4xl text-[var(--et-gold-bright)]" />
              <CardDescription className="mt-2">{stat.label}</CardDescription>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <FadeInOnScroll delay={0.15}>
        <Card>
          <CardTitle>Continúa tu historia</CardTitle>
          <CardDescription className="mt-1">
            Los agentes de Fase 2 llenarán esta pantalla con tu línea de tiempo, sugerencias de tu guía y los próximos pasos de tu legado.
          </CardDescription>
        </Card>
      </FadeInOnScroll>
    </div>
  );
}
