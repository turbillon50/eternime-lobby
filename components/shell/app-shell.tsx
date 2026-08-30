"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent, type PropsWithChildren, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useClerk } from "@clerk/nextjs";
import { PageTransition } from "@/components/motion";

export type NavItem = { href: string; label: string; icon: ReactNode };

function Icon({ d }: { d: string }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>;
}

export const APP_NAV: NavItem[] = [
  { href: "/app", label: "Chat", icon: <Icon d="M21 12a8 8 0 0 1-8 8H6l-4 2 1.4-4A9 9 0 1 1 21 12Z" /> },
  { href: "/app/recuerdos", label: "Memoria", icon: <Icon d="M12 3v18M7 5a4 4 0 0 0 0 8 4 4 0 0 0 0 6M17 5a4 4 0 0 1 0 8 4 4 0 0 1 0 6M7 9h5M12 15h5" /> },
  { href: "/app/proyectos", label: "Proyectos", icon: <Icon d="M4 7h6l2 2h8v10H4z" /> },
  { href: "/app/pendientes", label: "Pendientes", icon: <Icon d="M5 12l4 4L19 6" /> },
  { href: "/app/calendario", label: "Calendario", icon: <Icon d="M4 6h16v14H4zM8 3v6M16 3v6M4 10h16" /> },
  { href: "/app/boveda", label: "Bóveda", icon: <Icon d="M5 5h14v14H5zM5 9h14M9 5v4M9 13h6" /> },
  { href: "/app/guia", label: "Mi historia", icon: <Icon d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v18H6.5A2.5 2.5 0 0 1 4 18.5v-13ZM20 5.5A2.5 2.5 0 0 0 17.5 3H12v18h5.5a2.5 2.5 0 0 0 2.5-2.5v-13Z" /> },
  { href: "/app/cartas", label: "Cartas futuras", icon: <Icon d="M3 6h18v12H3zM3 7l9 6 9-6" /> },
  { href: "/app/ias", label: "Mis IAs", icon: <Icon d="M7 7h10v10H7zM3 12h4M17 12h4M12 3v4M12 17v4M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /> },
  { href: "/app/red", label: "Mi Red", icon: <Icon d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM5 20a4 4 0 1 1 0-8 4 4 0 0 1 0 8ZM19 20a4 4 0 1 1 0-8 4 4 0 0 1 0 8ZM9 10l-2 3M15 10l2 3" /> },
  { href: "/app/beneficiarios", label: "Personas", icon: <Icon d="M16 11a4 4 0 1 0-8 0M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /> },
  { href: "/app/cuenta", label: "Cuenta", icon: <Icon d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" /> },
  { href: "/app/perfil", label: "Yo", icon: <Icon d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 0 1 16 0" /> },
];

const FUTURE = ["Documentos"];
type ShellUser = { name?: string; email?: string; avatar_url?: string | null };

function Menu({ user, close, nav, brand }: { user: ShellUser | null; close: () => void; nav: NavItem[]; brand: string }) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  return <div className="flex h-full flex-col p-5 sm:p-6">
    <div className="mb-7 flex items-center justify-between">
      <Link href={brand.includes("ADMIN") ? "/admin" : "/app"} onClick={close} className="eon-sidebar-brand"><span className="eon-mark" /><span><b>{brand}</b><small>Memoria viva</small></span></Link>
      <button onClick={close} className="crystal-icon eon-menu-close" aria-label="Cerrar menú">×</button>
    </div>
    <nav className="space-y-1">
      {nav.map((item) => { const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} onClick={close} className={`eon-menu-item ${active ? "is-active" : ""}`}>{item.icon}<span>{item.label}</span></Link>; })}
    </nav>
    <div className="my-5 h-px bg-slate-900/8" />
    <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-400">Tu universo</p>
    <div className="space-y-1">{FUTURE.map(x => <div key={x} className="eon-menu-item opacity-60"><span className="h-5 w-5 rounded-md border border-current/30"/><span>{x}</span><span className="ml-auto text-[9px] uppercase tracking-wider">pronto</span></div>)}</div>
    <div className="mt-auto pt-6">
      <Link href="/app/perfil" onClick={close} className="mb-2 flex items-center gap-3 rounded-2xl p-3 hover:bg-white/50"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">{user?.name?.[0] || "·"}</span><span className="min-w-0"><b className="block truncate text-sm text-slate-800">{user?.name || "Tu perfil"}</b><span className="block truncate text-xs text-slate-500">{user?.email || "Eternime"}</span></span></Link>
      <button onClick={() => signOut({ redirectUrl: "/" })} className="w-full rounded-xl px-3 py-2 text-left text-xs text-slate-500 hover:bg-white/50">Cerrar sesión</button>
    </div>
  </div>;
}

export function AppShell({ children, nav = APP_NAV, brand = "EON" }: PropsWithChildren<{ nav?: NavItem[]; brand?: string }>) {
  const [user, setUser] = useState<ShellUser | null>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  useEffect(() => { fetch("/api/auth/me").then(r=>r.json()).then(d=>setUser(d.user ?? null)).catch(()=>{}); }, []);
  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => drawerRef.current?.querySelector<HTMLElement>("a,button")?.focus());
    const onEscape = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onEscape); trigger?.focus(); };
  }, [open]);
  function trapDrawerFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const focusable = [...(drawerRef.current?.querySelectorAll<HTMLElement>('a,button:not([disabled]),input,textarea,select,[tabindex]:not([tabindex="-1"])') ?? [])];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  const isChat = pathname === "/app" || pathname === "/app/hablar";
  const activeLabel = nav.find(item => item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href))?.label ?? "Eon";
  return <div className="eon-app min-h-svh">
    <div className="eon-mesh" aria-hidden />
    {!brand.includes("ADMIN") && <aside className="eon-desktop-sidebar" aria-label="Navegación de Eternime"><Menu user={user} close={()=>{}} nav={nav} brand={brand}/></aside>}
    <header className="eon-topbar">
      <div className="eon-topbar-mobile">
        <button ref={triggerRef} className="crystal-icon" onClick={() => setOpen(true)} aria-label="Abrir menú"><Icon d="M5 7h14M5 12h14M5 17h14" /></button>
        <Link href={brand.includes("ADMIN") ? "/admin" : "/app"} className="flex items-center gap-2 text-[15px] font-semibold tracking-[-.02em] text-slate-800"><span className="eon-mark"/>{brand}</Link>
        <Link href="/app/perfil" className="crystal-avatar" aria-label="Perfil">{user?.name?.[0] || "·"}</Link>
      </div>
      <div className="eon-desktop-header">
        <div className="eon-desktop-context"><small>Estás en</small><b>{activeLabel}</b></div>
        <Link href={brand.includes("ADMIN") ? "/admin" : "/app"} className="eon-desktop-brand"><span className="eon-mark"/><span><b>{brand}</b><small>Tu segunda memoria</small></span></Link>
        {!brand.includes("ADMIN") && <nav className="eon-desktop-nav" aria-label="Navegación de Eternime">
          <Link href="/app" className={pathname==="/app"?"active":""}>Eon</Link>
          <Link href="/app/recuerdos" className={pathname.startsWith("/app/recuerdos")?"active":""}>Memoria</Link>
          <Link href="/app/red" className={pathname.startsWith("/app/red")?"active":""}>Mi Red</Link>
          <Link href="/app/proyectos" className={pathname.startsWith("/app/proyectos")?"active":""}>Proyectos</Link>
          <Link href="/app/ias" className={pathname.startsWith("/app/ias")?"active":""}>Mis IAs</Link>
        </nav>}
        <div className="eon-desktop-actions">
          {!brand.includes("ADMIN") && <Link href="/app/hablar" className="eon-desktop-voice"><span className="eon-mark"/>Hablar con Eon</Link>}
          <button className="crystal-icon" onClick={() => setOpen(true)} aria-label="Abrir menú"><Icon d="M5 7h14M5 12h14M5 17h14" /></button>
          <Link href="/app/perfil" className="crystal-avatar" aria-label="Perfil">{user?.name?.[0] || "·"}</Link>
        </div>
      </div>
    </header>

    <AnimatePresence>{open && <><motion.button aria-label="Cerrar menú" className="eon-drawer-backdrop fixed inset-0 z-40" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setOpen(false)}/><motion.aside ref={drawerRef} onKeyDown={trapDrawerFocus} className="eon-drawer" role="dialog" aria-modal="true" aria-label="Menú de Eternime" initial={{x:"-105%"}} animate={{x:0}} exit={{x:"-105%"}} transition={{type:"spring", damping:30, stiffness:300}}><Menu user={user} close={()=>setOpen(false)} nav={nav} brand={brand}/></motion.aside></>}</AnimatePresence>

    <main className={`relative z-10 mx-auto w-full ${isChat ? "max-w-5xl" : "max-w-6xl"} px-4 pb-32 pt-5 sm:px-6 lg:px-8`}><PageTransition>{children}</PageTransition></main>

    {!brand.includes("ADMIN") && <footer className="eon-app-footer">
      <div className="eon-app-footer-inner">
        <div className="eon-app-footer-brand"><span className="eon-mark"/><div><b>Eternime</b><small>Tu memoria permanece contigo, aunque cambie la IA.</small></div></div>
        <nav><Link href="/privacidad">Privacidad</Link><Link href="/terminos">Términos</Link><Link href="/app/cuenta">Cuenta</Link><Link href="/app/ias">MCP / Mis IAs</Link></nav>
        <small>© {new Date().getFullYear()} Eternime · All Global Holding LLC</small>
      </div>
    </footer>}

    {!brand.includes("ADMIN") && <nav className="eon-tabbar" aria-label="Navegación principal">
      <Link href="/app" className={pathname==="/app" ? "active" : ""}><Icon d="M21 12a8 8 0 0 1-8 8H6l-4 2 1.4-4A9 9 0 1 1 21 12Z"/><span>Chat</span></Link>
      <Link href="/app/recuerdos" className={pathname.startsWith("/app/recuerdos") ? "active" : ""}><Icon d="M12 3v18M7 5a4 4 0 0 0 0 8 4 4 0 0 0 0 6M17 5a4 4 0 0 1 0 8 4 4 0 0 1 0 6"/><span>Memoria</span></Link>
      <Link href="/app/hablar" className={`compose ${pathname.startsWith("/app/hablar") ? "active" : ""}`} aria-label="Hablar con Eon" aria-current={pathname.startsWith("/app/hablar") ? "page" : undefined}><span className="compose-core"><Icon d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3ZM5 11a7 7 0 0 0 14 0M12 18v3"/></span></Link>
      <Link href="/app/red" className={pathname.startsWith("/app/red") ? "active" : ""}><Icon d="M5 18c2-3 4-4 7-4s5 1 7 4M8 9a4 4 0 1 0 8 0"/><span>Mi Red</span></Link>
      <Link href="/app/perfil" className={pathname.startsWith("/app/perfil") ? "active" : ""}><Icon d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 0 1 16 0"/><span>Yo</span></Link>
    </nav>}
  </div>;
}
