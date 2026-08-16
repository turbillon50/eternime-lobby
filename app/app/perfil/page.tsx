import type { Metadata } from "next";
import { FadeInOnScroll } from "@/components/motion";
import { PerfilClient } from "@/components/app/PerfilClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Perfil" };

export default function PerfilPage() {
  return (
    <div className="grid gap-6">
      <FadeInOnScroll>
        <p className="eon-screen-kicker">Tú</p><h1 className="eon-screen-title">La identidad que Eon va entendiendo.</h1>
        <p className="eon-screen-sub">Tu información, preferencias y archivos personales, bajo tu control.</p>
      </FadeInOnScroll>
      <PerfilClient />
    </div>
  );
}
