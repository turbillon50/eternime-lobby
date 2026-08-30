import type { Metadata } from "next";

import { IntegrationHub } from "@/components/app/IntegrationHub";

export const metadata: Metadata = { title: "Integraciones" };

export default function IntegrationsPage() {
  return <div className="grid gap-6">
    <header className="eon-page-head">
      <span className="eon-page-mark"/>
      <div>
        <p className="eon-page-kicker">Bajo tu control</p>
        <h1>Integraciones</h1>
        <p>Tu memoria, tu correo y tu contexto conectados con permisos claros.</p>
      </div>
    </header>
    <IntegrationHub/>
  </div>;
}
