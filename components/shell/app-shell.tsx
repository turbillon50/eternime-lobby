"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type PropsWithChildren, type ReactNode } from "react";
import { PageTransition } from "@/components/motion";
import { useT } from "@/components/i18n";
import type { DictKey } from "@/lib/i18n";

export type NavItem = { href: string; label: string; icon: ReactNode };

function Icon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export const APP_NAV: NavItem[] = [
  { href: "/app", label: "nav.home", icon: <Icon d="M3 11.5 12 4l9 7.5M5 10v10h14V10" /> },
  { href: "/app/recuerdos", label: "nav.memories", icon: <Icon d="M12 21s-7-4.4-9.5-9C.8 8.6 2.7 5 6.5 5c2.2 0 4 1.2 5.5 3 1.5-1.8 3.3-3 5.5-3 3.8 0 5.7 3.6 4 7-2.5 4.6-9.5 9-9.5 9Z" /> },
  { href: "/app/cartas", label: "nav.letters", icon: <Icon d="M4 6h16v12H4zM4 7l8 6 8-6" /> },
  { href: "/app/guia", label: "nav.guide", icon: <Icon d="M12 3a7 7 0 0 1 7 7c0 2.4-1.2 4-2.5 5.4-.8.8-1.5 2-1.5 3.1V20h-6v-1.5c0-1.1-.7-2.3-1.5-3.1C6.2 14 5 12.4 5 10a7 7 0 0 1 7-7ZM10 22h4" /> },
  { href: "/app/hablar", label: "nav.talk", icon: <Icon d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3ZM5 11a7 7 0 0 0 14 0M12 18v3" /> },
  { href: "/app/beneficiarios", label: "nav.beneficiaries", icon: <Icon d="M16 11a4 4 0 1 0-8 0M12 7a4 4 0 1 0 0-8M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /> },
  { href: "/app/perfil", label: "nav.profile", icon: <Icon d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 0 1 16 0" /> },
];

type ShellUser = { name?: string; email?: string; role?: string; avatar_url?: string | null; tagline?: string | null };

function SidebarProfile({ user, onNavigate }: { user: ShellUser | null; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname.startsWith("/app/perfil");
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "·";
  return (
    <Link
      href="/app/perfil"
      onClick={onNavigate}
      className={`group flex items-center gap-3 rounded-[var(--et-radius)] border p-2.5 transition ${
        active
          ? "border-[var(--et-border)] bg-[rgba(212,175,106,0.08)] shadow-[var(--et-glow)]"
          : "border-[var(--et-border-soft)] bg-[rgba(212,175,106,0.03)] hover:border-[var(--et-border)] hover:bg-[rgba(212,175,106,0.06)]"
      }`}
    >
      <span
        className="et-glow-ring flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--et-bg-elevated)] text-base font-medium text-[var(--et-gold-bright)]"
        style={user?.avatar_url ? { backgroundImage: `url(${user.avatar_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        {!user?.avatar_url ? initial : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-[var(--et-text)]">{user?.name ?? "—"}</span>
        <span className="block truncate text-xs text-[var(--et-text-faint)]">
          {user?.role === "admin" ? "Admin · " : ""}{user?.tagline || user?.email || ""}
        </span>
      </span>
      <span className="text-[var(--et-text-faint)] transition group-hover:text-[var(--et-gold)]">
        <Icon d="M9 6l6 6-6 6" />
      </span>
    </Link>
  );
}

function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const t = useT();
  return (
    <nav className="grid gap-1.5">
      {items.map((item) => {
        const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`group relative flex items-center gap-3 rounded-[var(--et-radius-sm)] py-2.5 pl-3.5 pr-3 text-sm transition ${
              active
                ? "bg-gradient-to-r from-[rgba(212,175,106,0.16)] to-transparent text-[var(--et-gold-bright)]"
                : "text-[var(--et-text-muted)] hover:bg-[rgba(245,242,234,0.04)] hover:text-[var(--et-text)]"
            }`}
          >
            {active ? (
              <motion.span layoutId="nav-active-bar" className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-[var(--et-gold)] shadow-[var(--et-glow)]" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
            ) : null}
            <span className={`flex h-8 w-8 items-center justify-center rounded-[var(--et-radius-sm)] transition ${active ? "bg-[rgba(212,175,106,0.14)] text-[var(--et-gold)]" : "text-[var(--et-text-faint)] group-hover:text-[var(--et-text-muted)]"}`}>
              {item.icon}
            </span>
            <span className="truncate">{t(item.label as DictKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function LogoutButton() {
  const router = useRouter();
  const t = useT();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
      className="flex w-full items-center gap-3 rounded-[var(--et-radius-sm)] px-3.5 py-2.5 text-sm text-[var(--et-text-faint)] transition hover:bg-[rgba(224,122,106,0.08)] hover:text-[var(--et-danger)]"
    >
      <span className="flex h-8 w-8 items-center justify-center"><Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></span>
      {t("nav.logout")}
    </button>
  );
}

function SidebarInner({ nav, brand, user, onNavigate }: { nav: NavItem[]; brand: string; user: ShellUser | null; onNavigate?: () => void }) {
  return (
    <>
      <div className="mb-6 flex items-center gap-2 px-1.5 pt-1">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--et-border)] text-[var(--et-gold-bright)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
        </span>
        <span className="et-serif text-[0.95rem] tracking-[0.22em] text-[var(--et-gold-bright)]">{brand}</span>
      </div>
      <SidebarProfile user={user} onNavigate={onNavigate} />
      <div className="my-5 h-px bg-gradient-to-r from-transparent via-[var(--et-border-soft)] to-transparent" />
      <p className="mb-2 px-2 text-[0.62rem] uppercase tracking-[0.24em] text-[var(--et-text-faint)]">Tu legado</p>
      <NavLinks items={nav} onNavigate={onNavigate} />
      <div className="mt-auto pt-6">
        <div className="mb-2 h-px bg-gradient-to-r from-transparent via-[var(--et-border-soft)] to-transparent" />
        <LogoutButton />
      </div>
    </>
  );
}

export function AppShell({ children, nav = APP_NAV, brand = "ETERNIME" }: PropsWithChildren<{ nav?: NavItem[]; brand?: string }>) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<ShellUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user ?? null)).catch(() => {});
  }, []);

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "·";

  return (
    <div className="et-surface flex min-h-svh">
      {/* Sidebar desktop */}
      <aside className="hidden w-[17.5rem] flex-col border-r border-[var(--et-border-soft)] bg-gradient-to-b from-[var(--et-bg-elevated)] to-[var(--et-bg)] p-4 lg:flex">
        <SidebarInner nav={nav} brand={brand} user={user} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar móvil */}
        <header className="flex items-center justify-between border-b border-[var(--et-border-soft)] bg-[var(--et-bg-elevated)] px-4 py-3 lg:hidden">
          <Link href="/app" className="et-serif text-base tracking-[0.2em] text-[var(--et-gold-bright)]">{brand}</Link>
          <button
            type="button"
            aria-label="Menú"
            onClick={() => setOpen(true)}
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[var(--et-border)] bg-[var(--et-bg-elevated)] text-sm text-[var(--et-gold-bright)]"
            style={user?.avatar_url ? { backgroundImage: `url(${user.avatar_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
          >
            {!user?.avatar_url ? initial : null}
          </button>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      {/* Drawer móvil */}
      <AnimatePresence>
        {open ? (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0" style={{ background: "rgba(5,5,8,0.7)", backdropFilter: "blur(6px)" }} onClick={() => setOpen(false)} />
            <motion.aside
              className="absolute inset-y-0 left-0 flex w-[18rem] flex-col border-r border-[var(--et-border-soft)] bg-gradient-to-b from-[var(--et-bg-elevated)] to-[var(--et-bg)] p-4"
              initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              <div className="mb-2 flex justify-end">
                <button type="button" aria-label="Cerrar" onClick={() => setOpen(false)} className="p-1.5 text-[var(--et-text-faint)] hover:text-[var(--et-text)]">
                  <Icon d="M18 6 6 18M6 6l12 12" />
                </button>
              </div>
              <SidebarInner nav={nav} brand={brand} user={user} onNavigate={() => setOpen(false)} />
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
