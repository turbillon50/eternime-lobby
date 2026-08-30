import type { Metadata } from "next";
import { GuiaClient } from "@/components/app/GuiaClient";

export const metadata: Metadata = { title: "Eon" };

export default function GuiaPage() {
  return (
    <div className="guia-page grid gap-6">
      <div>
        <p className="eon-screen-kicker">Eon</p>
        <h1 className="eon-screen-title">Piensa conmigo.</h1>
        <p className="eon-screen-sub">Una conversación que usa tu memoria para ayudarte a recordar, conectar y decidir.</p>
      </div>
      <GuiaClient />
    </div>
  );
}
