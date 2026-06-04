import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { listGuideMessages } from "@/lib/data/guide";
import { FadeInOnScroll } from "@/components/motion";
import { Card, CardDescription, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Mi guía" };

export default async function GuiaPage() {
  const session = await getSession();
  const messages = session ? await listGuideMessages(session.sub) : [];

  return (
    <div className="grid gap-6">
      <FadeInOnScroll>
        <h1 className="et-serif text-2xl text-[var(--et-text)]">Mi guía</h1>
        <p className="mt-1 text-sm text-[var(--et-text-muted)]">
          Tu inteligencia personal — aprende de tus recuerdos para acompañar a los tuyos.
        </p>
      </FadeInOnScroll>

      {messages.length === 0 ? (
        <EmptyState
          title="Tu guía aún no despierta"
          description="Cuando empieces a conversar, tu guía recordará cada palabra. Los agentes de Fase 2 traerán la conversación en vivo."
        />
      ) : (
        <div className="grid gap-3">
          {messages.map((message) => (
            <FadeInOnScroll key={message.id}>
              <Card padded className={message.role === "user" ? "ml-auto max-w-xl" : "mr-auto max-w-xl"}>
                <CardDescription className="!text-[var(--et-text)]">{message.content}</CardDescription>
              </Card>
            </FadeInOnScroll>
          ))}
        </div>
      )}
    </div>
  );
}
