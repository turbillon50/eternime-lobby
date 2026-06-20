"use client";

import Link from "next/link";
import { useT } from "@/components/i18n";

export function PublicHeader() {
  const t = useT();
  return (
    <header className="flex items-center justify-between px-5 py-4 sm:px-8">
      <Link href="/" className="et-serif text-lg tracking-[0.18em] text-[var(--et-gold-bright)]">
        ETERNIME
      </Link>
      <nav className="flex items-center gap-2">
        <Link href="/eon" className="et-btn et-btn-ghost !min-h-10 px-4 text-sm">{t("public.eon")}</Link>
        <Link href="/entrar" className="et-btn et-btn-ghost !min-h-10 px-4 text-sm">{t("public.enter")}</Link>
        <Link href="/crear" className="et-btn et-btn-secondary !min-h-10 px-4 text-sm">{t("public.create")}</Link>
      </nav>
    </header>
  );
}
