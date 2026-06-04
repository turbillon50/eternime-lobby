import Link from "next/link";
import { PageTransition } from "@/components/motion";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="et-surface flex min-h-svh flex-col">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="et-serif text-lg tracking-[0.18em] text-[var(--et-gold-bright)]">
          ETERNIME
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/eon" className="et-btn et-btn-ghost !min-h-10 px-4 text-sm">Eon</Link>
          <Link href="/entrar" className="et-btn et-btn-ghost !min-h-10 px-4 text-sm">
            Entrar
          </Link>
          <Link href="/crear" className="et-btn et-btn-secondary !min-h-10 px-4 text-sm">
            Crear mi legado
          </Link>
        </nav>
      </header>
      <main className="flex flex-1 flex-col">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
