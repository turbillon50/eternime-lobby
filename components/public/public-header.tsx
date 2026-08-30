import Link from "next/link";
import { AuthSheet } from "@/components/public/auth-sheet";
import { isClerkConfigured } from "@/lib/clerk";

function MobileMenu() {
  return (
    <details className="public-mobile-menu">
      <summary aria-label="Abrir menú de navegación">
        <span aria-hidden />
        <span aria-hidden />
        <span aria-hidden />
      </summary>
      <div>
        <Link href="/como-funciona">Cómo funciona</Link>
        <Link href="/eon">Eon</Link>
        <Link href="/videos">Videos y redes</Link>
        <Link href="/precios">Precios</Link>
      </div>
    </details>
  );
}

export function PublicHeader() {
  const account = isClerkConfigured()
    ? <AuthSheet />
    : <Link href="/sign-in" className="public-account-btn">Entrar</Link>;

  return (
    <header className="public-crystal-header">
      <Link href="/" className="public-brand"><span className="eon-mark"/><span><b>EON</b><small>ETERNIME</small></span></Link>
      <div className="public-header-actions">
        <nav className="public-desktop-nav" aria-label="Navegación principal">
          <Link href="/como-funciona">Cómo funciona</Link>
          <Link href="/eon">Eon</Link>
          <Link href="/videos">Videos y redes</Link>
        </nav>
        <MobileMenu />
        {account}
      </div>
    </header>
  );
}
