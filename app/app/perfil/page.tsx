import type { Metadata } from "next";
import Link from "next/link";
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
      <Link href="/app/integraciones" className="integration-entry">
        <span><b>Tu ecosistema conectado</b><small>Administra Neon, correo, calendario y documentos sin compartir tus credenciales con Eternime.</small></span>
        <strong>Ver integraciones <span aria-hidden>→</span></strong>
      </Link>
      <PerfilClient />
    </div>
  );
}
