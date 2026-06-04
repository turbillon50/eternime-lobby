import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { listLetters } from "@/lib/data/letters";
import { FadeInOnScroll, StaggerContainer, StaggerItem } from "@/components/motion";
import { Badge, Card, CardDescription, CardTitle, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Cartas de legado" };

export default async function CartasPage() {
  const session = await getSession();
  const letters = session ? await listLetters(session.sub) : [];

  return (
    <div className="grid gap-6">
      <FadeInOnScroll>
        <h1 className="et-serif text-2xl text-[var(--et-text)]">Cartas de legado</h1>
        <p className="mt-1 text-sm text-[var(--et-text-muted)]">Palabras que llegarán justo cuando deban llegar.</p>
      </FadeInOnScroll>

      {letters.length === 0 ? (
        <EmptyState
          title="Aún no hay cartas"
          description="Escribe hoy lo que quieres que alguien lea mañana. Las cartas pueden programarse para una fecha especial."
        />
      ) : (
        <StaggerContainer className="grid gap-4 sm:grid-cols-2">
          {letters.map((letter) => (
            <StaggerItem key={letter.id}>
              <Card>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <CardTitle>{letter.title}</CardTitle>
                  <Badge tone={letter.status === "delivered" ? "success" : "muted"}>{letter.status}</Badge>
                </div>
                <CardDescription>Para {letter.recipient_name}</CardDescription>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}
