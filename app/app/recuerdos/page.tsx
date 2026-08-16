import type { Metadata } from "next";
import { FadeInOnScroll } from "@/components/motion";
import { RecuerdosClient } from "@/components/app/RecuerdosClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Memoria" };

export default function RecuerdosPage() {
  return (
    <div className="grid gap-6">
      <FadeInOnScroll>
        <p className="eon-screen-kicker">Memoria</p><h1 className="eon-screen-title">Todo lo que no quieres perder.</h1>
        <p className="eon-screen-sub">Recuerdos, ideas, conversaciones y archivos que Eon puede volver a encontrar contigo.</p>
      </FadeInOnScroll>
      <RecuerdosClient />
    </div>
  );
}
