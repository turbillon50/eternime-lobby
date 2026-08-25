"use client";

/**
 * Shell de Eternime.
 *
 * Escritorio: sidebar real y estable + topbar mínima con búsqueda. Sin bottom
 * tab bar, sin hamburguesa como navegación primaria.
 * Móvil: header compacto + drawer Craft (focus trap, Escape, gesto, backdrop)
 * + UNA sola bottom navigation de 5 destinos reales.
 *
 * Ninguna ruta nueva: todos los destinos ya existían.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback, useEffect, useRef, useState,
  type PropsWithChildren, type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useClerk } from "@clerk/nextjs";
import { PageTransition } from "@/components/motion";
import { EonOrb } from "@/components/eon/EonOrb";
import { EonStateProvider } from "@/components/eon/eon-state";
import {
  IconHome, IconMemory, IconPeople, IconProjects, IconTimeline, IconVault,
  IconSearch, IconMenu, IconClose, IconUser, IconLetter, IconIas, IconTask,
  IconVoice, IconLogout, IconNote, IconSocio, IconCollapse, IconWelcome,
  IconAccount, IconDoc,
} from "./icons";

export type NavItem = { href: string; label: string; icon: ReactNode };
type NavGroup = { title: string; items: NavItem[] };

/** Destinos primarios — sidebar de escritorio. */
export const APP_NAV: NavItem[] = [
  { href: "/app",             label: "Inicio",    icon: <IconHome /> },
  { href: "/app/recuerdos",   label: "Memoria",   icon: <IconMemory /> },
  { href: "/app/red",         label: "Personas",  icon: <IconPeople /> },
  { href: "/app/proyectos",   label: "Proyectos", icon: <IconProjects /> },
  { href: "/app/calendario",  label: "Timeline",  icon: <IconTimeline /> },
  { href: "/app/boveda",      label: "Bóveda",    icon: <IconVault /> },
];

/** Secundarios agrupados con jerarquía — viven en el drawer. */
export const APP_SECONDARY: NavGroup[] = [
  {
    title: "Tu memoria",
    items: [
      { href: "/app/guia",    label: "Mi Historia",    icon: <IconNote /> },
      { href: "/app/cartas",  label: "Cartas futuras", icon: <IconLetter /> },
    ],
  },
  {
    title: "Tu gente",
    items: [
      { href: "/app/beneficiarios", label: "Beneficiarios", icon: <IconPeople /> },
    ],
  },
  {
    title: "Tu día",
    items: [
      { href: "/app/pendientes", label: "Pendientes", icon: <IconTask /> },
    ],
  },
  {
    title: "Eon",
    items: [
      { href: "/app/hablar", label: "Hablar con Eon", icon: <IconVoice /> },
      { href: "/app/ias",    label: "Mis IAs · MCP",  icon: <IconIas /> },
    ],
  },
  {
    title: "Tu cuenta",
    items: [
      { href: "/app/perfil",     label: "Perfil",     icon: <IconUser /> },
      { href: "/app/cuenta",     label: "Cuenta",     icon: <IconAccount /> },
      { href: "/app/socio",      label: "Socios",     icon: <IconSocio /> },
      { href: "/app/bienvenida", label: "Bienvenida", icon: <IconWelcome /> },
    ],
  },
];

/** Bottom navigation: 5 destinos reales, exactamente un activo. */
const TABS: NavItem[] = [
  { href: "/app",           label: "Inicio",   icon: <IconHome size={21} /> },
  { href: "/app/recuerdos", label: "Memoria",  icon: <IconMemory size={21} /> },
  { href: "/app/hablar",    label: "Eon",      icon: <IconVoice size={21} /> },
  { href: "/app/red",       label: "Personas", icon: <IconPeople size={21} /> },
  { href: "/app/boveda",    label: "Bóveda",   icon: <IconVault size={21} /> },
];

type ShellUser = { name?: string; email?: string; avatar_url?: string | null };

function isActive(pathname: string, href: string) {
  return href === "/app" || href === "/admin" ? pathname === href : pathname.startsWith(href);
}

/** Título de contexto para el header móvil, desde las rutas reales. */
function contextLabel(pathname: string, nav: NavItem[], secondary: NavGroup[]): string {
  const all = [...nav, ...secondary.flatMap((g) => g.items)];
  const hit = all
    .filter((i) => isActive(pathname, i.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return hit?.label ?? "Eternime";
}

/* ── Drawer Craft ─────────────────────────────────────────────────────── */
function Drawer({
  user, close, nav, secondary, brand,
}: {
  user: ShellUser | null; close: () => void;
  nav: NavItem[]; secondary: NavGroup[]; brand: string;
}) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const ref = useRef<HTMLDivElement>(null);

  // Focus trap + Escape + restauración de foco
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const sel =
      'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
    const first = el?.querySelector<HTMLElement>(sel);
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab" || !el) return;
      const items = Array.from(el.querySelectorAll<HTMLElement>(sel)).filter(
        (n) => n.offsetParent !== null,
      );
      if (!items.length) return;
      const f = items[0], l = items[items.length - 1];
      if (e.shiftKey && document.activeElement === f) { e.preventDefault(); l.focus(); }
      else if (!e.shiftKey && document.activeElement === l) { e.preventDefault(); f.focus(); }
    };
    document.addEventListener("keydown", onKey);

    // Bloqueo real del scroll de fondo (sin salto de layout)
    const { overflow, paddingRight } = document.body.style;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      prev?.focus?.();
    };
  }, [close]);

  const isAdmin = brand.includes("ADMIN");

  return (
    <div ref={ref} className="flex h-full flex-col" role="dialog" aria-modal="true" aria-label="Navegación">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
        <Link href={isAdmin ? "/admin" : "/app"} onClick={close} className="eon-brand">
          {/* EON en estado reducido dentro del drawer */}
          <EonOrb size={34} interactive={false} />
          <span className="eon-brand-text">
            <b>{isAdmin ? "ADMIN" : "EON"}</b>
            <small>{isAdmin ? "Eternime" : "Eternime"}</small>
          </span>
        </Link>
        <button onClick={close} className="crystal-icon" aria-label="Cerrar menú">
          <IconClose />
        </button>
      </div>

      <div className="eon-drawer-body">
        <nav aria-label="Navegación principal" className="grid gap-[3px]">
          {nav.map((item) => (
            <Link
              key={item.href} href={item.href} onClick={close}
              className={`eon-menu-item ${isActive(pathname, item.href) ? "is-active" : ""}`}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {secondary.map((group) => (
          <div key={group.title}>
            <p className="eon-nav-group">{group.title}</p>
            <nav aria-label={group.title} className="grid gap-[3px]">
              {group.items.map((item) => (
                <Link
                  key={item.href} href={item.href} onClick={close}
                  className={`eon-menu-item ${isActive(pathname, item.href) ? "is-active" : ""}`}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        ))}
      </div>

      <div className="px-4 pb-4">
        <hr className="eon-rule" />
        <Link href={isAdmin ? "/admin" : "/app/perfil"} onClick={close} className="eon-menu-item">
          <span className="crystal-avatar" style={{ width: 30, height: 30 }}>
            {user?.name?.[0] || "·"}
          </span>
          <span className="min-w-0">
            <b className="block truncate text-[13px] text-[var(--eon-ivory)]">{user?.name || "Tu perfil"}</b>
            <small className="block truncate text-[10px] text-[var(--eon-faint)]">{user?.email || "Eternime"}</small>
          </span>
        </Link>
        <button onClick={() => signOut({ redirectUrl: "/" })} className="eon-menu-item w-full">
          <IconLogout />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}

/* ── Shell ────────────────────────────────────────────────────────────── */
export function AppShell({
  children,
  nav = APP_NAV,
  brand = "Eternime",
  secondary,
}: PropsWithChildren<{
  nav?: NavItem[];
  brand?: string;
  secondary?: NavGroup[];
}>) {
  const [user, setUser] = useState<ShellUser | null>(null);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const pathname = usePathname();
  const isAdmin = brand.includes("ADMIN");
  const groups = secondary ?? (isAdmin ? [] : APP_SECONDARY);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => {});
  }, []);

  // Preferencia de sidebar colapsada (se lee tras pintar, no en el cuerpo
  // del efecto, para no encadenar renders ni romper la hidratación).
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try { setCollapsed(localStorage.getItem("eon:sidebar") === "collapsed"); } catch {}
    });
    return () => cancelAnimationFrame(id);
  }, []);
  const toggleCollapsed = () => {
    setCollapsed((v) => {
      try { localStorage.setItem("eon:sidebar", v ? "open" : "collapsed"); } catch {}
      return !v;
    });
  };

  // Teclado virtual real (visualViewport): prioriza el compose
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      const hidden = window.innerHeight - vv.height;
      setKeyboard(hidden > 140);
      document.documentElement.style.setProperty("--eon-kb", `${Math.max(0, hidden)}px`);
    };
    vv.addEventListener("resize", onResize);
    onResize();
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  const showTabs = !isAdmin;

  return (
    <EonStateProvider>
      <div className="eon-app" data-keyboard={keyboard ? "open" : "closed"}>
        <div className="eon-mesh" aria-hidden />

        <div className="eon-shell" data-collapsed={collapsed ? "true" : "false"}>
          {/* ── Sidebar (escritorio) ── */}
          <aside className="eon-sidebar">
            <Link href={isAdmin ? "/admin" : "/app"} className="eon-brand">
              <EonOrb size={collapsed ? 38 : 44} label="EON, tu presencia en Eternime" />
              <span className="eon-brand-text">
                <b>{isAdmin ? "ADMIN" : "EON"}</b>
                <small>Eternime</small>
              </span>
            </Link>

            <nav className="eon-sidebar-nav" aria-label="Navegación principal">
              {nav.map((item) => (
                <Link
                  key={item.href} href={item.href}
                  className={`eon-nav-item ${isActive(pathname, item.href) ? "is-active" : ""}`}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="eon-sidebar-foot">
              <hr className="eon-rule" />
              <button
                onClick={toggleCollapsed}
                className="eon-nav-item w-full"
                aria-label={collapsed ? "Expandir menú lateral" : "Colapsar menú lateral"}
                aria-expanded={!collapsed}
              >
                <IconCollapse style={{ transform: collapsed ? "none" : "scaleX(-1)" }} />
                <span>Colapsar</span>
              </button>
              <Link href={isAdmin ? "/admin" : "/app/perfil"} className="eon-nav-item">
                <span className="crystal-avatar" style={{ width: 26, height: 26, fontSize: 11 }}>
                  {user?.name?.[0] || "·"}
                </span>
                <span className="truncate">{user?.name || "Tu perfil"}</span>
              </Link>
            </div>
          </aside>

          {/* ── Columna central ── */}
          <div className="min-w-0">
            <header className="eon-topbar">
              {/* Header móvil compacto: EON pequeño + contexto + acciones reales */}
              <div className="eon-topbar-mobile">
                <button className="crystal-icon" onClick={() => setOpen(true)} aria-label="Abrir menú" aria-expanded={open}>
                  <IconMenu />
                </button>
                <Link href={isAdmin ? "/admin" : "/app"} className="flex flex-1 items-center gap-2 min-w-0">
                  <EonOrb size={30} interactive={false} />
                  <span className="eon-topbar-context">
                    <b>{contextLabel(pathname, nav, groups)}</b>
                    <small>{isAdmin ? "Admin" : "Eternime"}</small>
                  </span>
                </Link>
                <Link href={isAdmin ? "/admin" : "/app/perfil"} className="crystal-avatar" aria-label="Tu perfil">
                  {user?.name?.[0] || "·"}
                </Link>
              </div>

              {/* Topbar mínima de escritorio */}
              <div className="eon-desktop-header">
                <form className="eon-search" role="search" action="/app/recuerdos">
                  <IconSearch size={17} />
                  <input
                    type="search" name="q" placeholder="Buscar en tu memoria"
                    aria-label="Buscar en tu memoria" enterKeyHint="search"
                  />
                  <kbd>⌘K</kbd>
                </form>
                <div className="eon-desktop-actions">
                  <Link href="/app/pendientes" className="crystal-icon" aria-label="Pendientes">
                    <IconTask />
                  </Link>
                  <button className="crystal-icon" onClick={() => setOpen(true)} aria-label="Abrir menú" aria-expanded={open}>
                    <IconMenu />
                  </button>
                </div>
              </div>
            </header>

            <main className="eon-main">
              <PageTransition>{children}</PageTransition>
            </main>
          </div>

        </div>

        {/* ── Drawer móvil ── */}
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                className="eon-drawer-backdrop"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={close}
                aria-hidden
              />
              <motion.aside
                className="eon-drawer"
                initial={{ x: "-102%" }} animate={{ x: 0 }} exit={{ x: "-102%" }}
                transition={{ type: "spring", damping: 32, stiffness: 320 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0.4, right: 0 }}
                onDragEnd={(_, info) => { if (info.offset.x < -70) close(); }}
              >
                <Drawer user={user} close={close} nav={nav} secondary={groups} brand={brand} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── Bottom navigation: una sola, sólo móvil ── */}
        {showTabs && (
          <nav className="eon-tabbar" aria-label="Navegación principal">
            {TABS.map((t) => {
              const active = isActive(pathname, t.href);
              return (
                <Link
                  key={t.href} href={t.href}
                  className={active ? "active" : ""}
                  aria-current={active ? "page" : undefined}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </EonStateProvider>
  );
}
