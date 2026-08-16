import type { Metadata } from "next";
import { NetworkClient } from "@/components/app/NetworkClient";

export const metadata: Metadata = { title: "Mi Red" };
export const dynamic = "force-dynamic";

export default function NetworkPage() {
  return (
    <div className="grid gap-6">
      <header className="eon-page-head">
        <span className="eon-page-orb" />
        <div>
          <p className="eon-page-kicker">Inteligencia relacional</p>
          <h1>Mi Red</h1>
          <p>Personas, capacidades y caminos que Eon puede conectar contigo.</p>
        </div>
      </header>
      <NetworkClient />
    </div>
  );
}
