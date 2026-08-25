"use client";
import Link from "next/link";
import { AuthSheet } from "@/components/public/auth-sheet";
import { EonOrb } from "@/components/eon/EonOrb";

/** La marca es Eternime. Eon — el orbe — la acompaña como presencia. */
export function PublicHeader() {
  return (
    <header className="public-crystal-header">
      <Link href="/" className="public-brand">
        <EonOrb size={34} label="Eon, tu guía en Eternime" />
        <span className="eon-brand-text">
          <b>Eternime</b>
          <small>Tu segunda memoria</small>
        </span>
      </Link>
      <nav>
        <Link href="/como-funciona">Cómo funciona</Link>
        <Link href="/eon">Eon</Link>
        <Link href="/precios">Precios</Link>
        <Link href="/crear" className="public-cta">Crear mi memoria</Link>
        <AuthSheet />
      </nav>
    </header>
  );
}
