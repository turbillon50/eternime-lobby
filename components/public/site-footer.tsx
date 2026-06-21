import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-[var(--et-border-soft)] px-5 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="et-serif text-base tracking-[0.18em] text-[var(--et-gold-bright)]">ETERNIME</p>
          <p className="mt-1 text-xs text-[var(--et-text-faint)]">Tu legado vive para siempre.</p>
        </div>
        <nav className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-[var(--et-text-muted)] sm:grid-cols-3">
          <Link href="/como-funciona" className="transition hover:text-[var(--et-text)]">Cómo funciona</Link>
          <Link href="/manifiesto" className="transition hover:text-[var(--et-text)]">Manifiesto</Link>
          <Link href="/precios" className="transition hover:text-[var(--et-text)]">Precios</Link>
          <Link href="/privacidad" className="transition hover:text-[var(--et-text)]">Privacidad</Link>
          <Link href="/terminos" className="transition hover:text-[var(--et-text)]">Términos</Link>
          <Link href="/cookies" className="transition hover:text-[var(--et-text)]">Cookies</Link>
          <Link href="/reembolsos" className="transition hover:text-[var(--et-text)]">Reembolsos</Link>
          <Link href="/eula" className="transition hover:text-[var(--et-text)]">EULA</Link>
          <Link href="/eliminar-cuenta" className="transition hover:text-[var(--et-text)]">Eliminar cuenta</Link>
        </nav>
      </div>
      <p className="mx-auto mt-8 w-full max-w-6xl text-xs text-[var(--et-text-faint)]">
        © {year} Eternime · All Global Holding LLC. Todos los derechos reservados.
      </p>
    </footer>
  );
}
