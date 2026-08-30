import Link from "next/link";
import { AuthSheet } from "@/components/public/auth-sheet";
import { isClerkConfigured } from "@/lib/clerk";

const MEDIA_LINKS = [
  { href: "/videos", label: "Video oficial", detail: "La historia de Eternime" },
  { href: "/app/red", label: "Cómo crece Mi Red", detail: "Personas y relaciones" },
  { href: "/app/integraciones", label: "Conexiones", detail: "Fuentes bajo tu control" },
  { href: "/precios", label: "Planes y costos", detail: "Semilla, Legado y Socio" },
] as const;

function MediaMenu() {
  return (
    <details className="public-media-menu">
      <summary>Videos y redes <span aria-hidden>⌄</span></summary>
      <div className="public-media-menu__panel">
        {MEDIA_LINKS.map((item, index) => (
          <Link href={item.href} key={item.href}>
            <span>0{index + 1}</span>
            <b>{item.label}</b>
            <small>{item.detail}</small>
          </Link>
        ))}
      </div>
    </details>
  );
}

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
        <p className="public-mobile-menu__label">Videos y redes</p>
        {MEDIA_LINKS.map((item) => <Link href={item.href} key={item.href} className="public-mobile-menu__child">{item.label}</Link>)}
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
          <MediaMenu />
        </nav>
        <MobileMenu />
        {account}
      </div>
    </header>
  );
}
