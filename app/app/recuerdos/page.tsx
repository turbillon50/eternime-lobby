import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { listMemories } from "@/lib/data/memories";
import { FadeInOnScroll, StaggerContainer, StaggerItem } from "@/components/motion";
import { Badge, Card, CardDescription, CardTitle, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Mis recuerdos" };

export default async function RecuerdosPage() {
  const session = await getSession();
  const memories = session ? await listMemories(session.sub) : [];

  return (
    <div className="grid gap-6">
      <FadeInOnScroll>
        <h1 className="et-serif text-2xl text-[var(--et-text)]">Mis recuerdos</h1>
        <p className="mt-1 text-sm text-[var(--et-text-muted)]">Los momentos que definen quién eres.</p>
      </FadeInOnScroll>

      {memories.length === 0 ? (
        <EmptyState
          title="Aún no hay recuerdos"
          description="Tu primer recuerdo está esperando. Pronto podrás guardarlo en texto, voz, foto o video."
        />
      ) : (
        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {memories.map((memory) => (
            <StaggerItem key={memory.id}>
              <Card>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <CardTitle>{memory.title}</CardTitle>
                  <Badge>{memory.kind}</Badge>
                </div>
                {memory.content ? <CardDescription>{memory.content.slice(0, 140)}</CardDescription> : null}
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}
