import Link from "next/link";

const grupos: Array<{ titulo: string; links: Array<[string, string]> }> = [
  { titulo: "Producto", links: [["/como-funciona", "Cómo funciona"], ["/eon", "Eon"], ["/precios", "Precios"], ["/manifiesto", "Manifiesto"]] },
  { titulo: "Legal", links: [["/privacidad", "Privacidad"], ["/terminos", "Términos"], ["/cookies", "Cookies"], ["/eula", "EULA"]] },
  { titulo: "Cuenta", links: [["/crear", "Crear mi memoria"], ["/entrar", "Entrar"], ["/reembolsos", "Reembolsos"], ["/eliminar-cuenta", "Eliminar cuenta"]] },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <p className="site-footer-logo">Eternime</p>
          <p>Tu legado vive para siempre.</p>
        </div>
        <nav className="site-footer-cols" aria-label="Mapa del sitio">
          {grupos.map((g) => (
            <div key={g.titulo}>
              <p className="site-footer-eyebrow">{g.titulo}</p>
              <ul>
                {g.links.map(([href, label]) => (
                  <li key={href}>
                    <Link href={href}>{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <p className="site-footer-legal">
        © {year} Eternime · All Global Holding LLC. Todos los derechos reservados.
      </p>
    </footer>
  );
}
