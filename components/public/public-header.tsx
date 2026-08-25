"use client";
import Link from "next/link";
import { AuthSheet } from "@/components/public/auth-sheet";
import { EonOrb } from "@/components/eon/EonOrb";

/**
 * Lockup de marca igual que en el shell: EON es la entidad, Eternime el
 * producto — tal como aparece en la referencia visual.
 */
export function PublicHeader() {
  return (
    <header className="public-crystal-header">
      <Link href="/" className="public-brand">
        <EonOrb size={34} label="EON" />
        <span className="eon-brand-text">
          <b>EON</b>
          <small>Eternime</small>
        </span>
      </Link>
      <nav>
        <Link href="/como-funciona">Cómo funciona</Link>
        <Link href="/eon">Eon</Link>
        <AuthSheet />
      </nav>
    </header>
  );
}
