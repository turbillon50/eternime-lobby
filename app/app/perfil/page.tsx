import type { Metadata } from "next";
import { getSession, getSessionUser } from "@/lib/auth";
import { FadeInOnScroll } from "@/components/motion";
import { Badge, Card, CardDescription, CardTitle } from "@/components/ui";

export const metadata: Metadata = { title: "Perfil" };

export default async function PerfilPage() {
  const session = await getSession();
  const user = await getSessionUser();
  const name = user?.name ?? session?.name ?? "";
  const email = user?.email ?? session?.email ?? "";

  return (
    <div className="grid gap-6">
      <FadeInOnScroll>
        <h1 className="et-serif text-2xl text-[var(--et-text)]">Perfil</h1>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.1}>
        <Card>
          <div className="flex items-center gap-4">
            <div className="et-glow-ring flex h-14 w-14 items-center justify-center rounded-full text-lg text-[var(--et-gold-bright)]">
              {name ? name.charAt(0).toUpperCase() : "·"}
            </div>
            <div>
              <CardTitle>{name || "Tu nombre"}</CardTitle>
              <CardDescription>{email}</CardDescription>
            </div>
            <Badge className="ml-auto">{(user?.role ?? session?.role) === "admin" ? "Admin" : "Miembro"}</Badge>
          </div>
        </Card>
      </FadeInOnScroll>
    </div>
  );
}
