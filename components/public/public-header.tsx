"use client";

import Link from "next/link";
import { useT } from "@/components/i18n";
import { AuthSheet } from "@/components/public/auth-sheet";

export function PublicHeader() {
  const t = useT();
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--et-border-soft)] bg-[var(--et-bg-overlay)] px-5 py-3 backdrop-blur sm:px-8">
      <Link href="/" className="et-serif text-lg tracking-[0.18em] text-[var(--et-gold-bright)]">ETERNIME</Link>
      <nav className="flex items-center gap-2">
        <Link href="/eon" className="et-btn et-btn-ghost !min-h-10 px-4 text-sm">{t("public.eon")}</Link>
        <Link href="/crear" className="et-btn et-btn-secondary !min-h-10 px-4 text-sm">{t("public.create")}</Link>
        <AuthSheet />
      </nav>
    </header>
  );
}
