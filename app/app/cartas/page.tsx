import type { Metadata } from "next";
import { FadeInOnScroll } from "@/components/motion";
import { CartasClient } from "@/components/app/CartasClient";

export const metadata: Metadata = { title: "Cartas futuras" };

export default function CartasPage() {
  return (
    <div className="grid gap-6">
      <FadeInOnScroll>
        <p className="eon-screen-kicker">Cartas futuras</p><h1 className="eon-screen-title">Palabras que pueden esperar el momento correcto.</h1>
        <p className="eon-screen-sub">Escribe hoy. Decide cuándo, cómo y para quién deben aparecer después.</p>
      </FadeInOnScroll>
      <CartasClient />
    </div>
  );
}
