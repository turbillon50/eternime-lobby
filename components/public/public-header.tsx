"use client";

import Link from "next/link";
import { AuthSheet } from "@/components/public/auth-sheet";

/**
 * Header publico. Texto fijo en espanol: el contenido de las paginas publicas
 * (landing, como-funciona, precios, etc.) todavia no esta traducido de verdad,
 * solo el header lo estaba via i18n — eso causaba una mezcla rara de idiomas
 * (header en ingles, cuerpo en espanol) cuando el visitante tenia el toggle
 * EN activo. Hasta que se traduzca el sitio completo, todo queda en espanol.
 */
export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--et-border-soft)] bg-[var(--et-bg-overlay)] px-5 py-3 backdrop-blur sm:px-8">
      <Link href="/" className="et-serif text-lg tracking-[0.18em] text-[var(--et-gold-bright)]">ETERNIME</Link>
      <nav className="flex items-center gap-2">
        <Link href="/eon" className="et-btn et-btn-ghost !min-h-10 px-4 text-sm">Eon</Link>
        <Link href="/crear" className="et-btn et-btn-secondary !min-h-10 px-4 text-sm">Crear mi legado</Link>
        <AuthSheet />
      </nav>
    </header>
  );
}
