import type { Metadata } from "next";
import { FadeInOnScroll } from "@/components/motion";
import { GuiaClient } from "@/components/app/GuiaClient";

export const metadata: Metadata = { title: "Eon" };

export default function GuiaPage() {
  return (
    <div className="grid gap-6">
      <FadeInOnScroll>
        <div>
          <p className="eon-screen-kicker">Eon</p>
          <h1 className="eon-screen-title">Piensa conmigo.</h1>
          <p className="eon-screen-sub">Una conversación que usa tu memoria para ayudarte a recordar, conectar y decidir.</p>
        </div>
      </FadeInOnScroll>
      <GuiaClient />
    </div>
  );
}
