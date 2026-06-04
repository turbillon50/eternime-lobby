import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { listBeneficiaries } from "@/lib/data/beneficiaries";
import { FadeInOnScroll, StaggerContainer, StaggerItem } from "@/components/motion";
import { Card, CardDescription, CardTitle, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Beneficiarios" };

export default async function BeneficiariosPage() {
  const session = await getSession();
  const beneficiaries = session ? await listBeneficiaries(session.sub) : [];

  return (
    <div className="grid gap-6">
      <FadeInOnScroll>
        <h1 className="et-serif text-2xl text-[var(--et-text)]">Beneficiarios</h1>
        <p className="mt-1 text-sm text-[var(--et-text-muted)]">Las personas que recibirán tu legado.</p>
      </FadeInOnScroll>

      {beneficiaries.length === 0 ? (
        <EmptyState
          title="Aún no hay beneficiarios"
          description="Agrega a las personas que amas para que tu legado llegue a las manos correctas."
        />
      ) : (
        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {beneficiaries.map((person) => (
            <StaggerItem key={person.id}>
              <Card>
                <CardTitle>{person.name}</CardTitle>
                {person.relationship ? <CardDescription className="mt-1">{person.relationship}</CardDescription> : null}
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}
