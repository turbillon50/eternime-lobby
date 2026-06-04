"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type PropsWithChildren, type ReactNode } from "react";
import { PageTransition } from "@/components/motion";

export type NavItem = { href: string; label: string; icon: ReactNode };

function Icon({ d }: { d: string }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export const APP_NAV: NavItem[] = [
  { href: "/app", label: "Inicio", icon: <Icon d="M3 11.5 12 4l9 7.5M5 10v10h14V10" /> },
  { href: "/app/recuerdos", label: "Mis recuerdos", icon: <Icon d="M12 21s-7-4.4-9.5-9C.8 8.6 2.7 5 6.5 5c2.2 0 4 1.2 5.5 3 1.5-1.8 3.3-3 5.5-3 3.8 0 5.7 3.6 4 7-2.5 4.6-9.5 9-9.5 9Z" /> },
  { href: "/app/cartas", label: "Cartas de legado", icon: <Icon d="M4 6h16v12H4zM4 7l8 6 8-6" /> },
  { href: "/app/guia", label: "Mi guía", icon: <Icon d="M12 3a7 7 0 0 1 7 7c0 2.4-1.2 4-2.5 5.4-.8.8-1.5 2-1.5 3.1V20h-6v-1.5c0-1.1-.7-2.3-1.5-3.1C6.2 14 5 12.4 5 10a7 7 0 0 1 7-7ZM10 22h4" /> },
  { href: "/app/beneficiarios", label: "Beneficiarios", icon: <Icon d="M16 11a4 4 0 1 0-8 0M12 7a4 4 0 1 0 0-8M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /> },
  { href: "/app/perfil", label: "Perfil", icon: <Icon d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 0 1 16 0" /> },
];

function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="grid gap-1">
      {items.map((item) => {
        const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-[var(--et-radius-sm)] px-3 py-2.5 text-sm transition ${
              active
                ? "bg-[rgba(212,175,106,0.12)] text-[var(--et-gold-bright)] shadow-[var(--et-glow)]"
                : "text-[var(--et-text-muted)] hover:bg-[rgba(245,242,234,0.05)] hover:text-[var(--et-text)]"
            }`}
          >
            <span className={active ? "text-[var(--et-gold)]" : ""}>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
      className={`flex items-center gap-3 rounded-[var(--et-radius-sm)] px-3 py-2.5 text-sm text-[var(--et-text-faint)] transition hover:bg-[rgba(245,242,234,0.05)] hover:text-[var(--et-text)] ${className}`}
    >
      <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
      Cerrar sesión
    </button>
  );
}

export function AppShell({ children, nav = APP_NAV, brand = "ETERNIME" }: PropsWithChildren<{ nav?: NavItem[]; brand?: string }>) {
  const [open, setOpen] = useState(false);

  return (
    <div className="et-surface flex min-h-svh">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 flex-col border-r border-[var(--et-border-soft)] bg-[var(--et-bg-elevated)] p-4 lg:flex">
        <Link href="/app" className="et-serif mb-8 block px-3 pt-2 text-lg tracking-[0.18em] text-[var(--et-gold-bright)]">
          {brand}
        </Link>
        <NavLinks items={nav} />
        <div className="mt-auto pt-6">
          <LogoutButton />
        </div>
      </aside>

      {/* Topbar móvil */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[var(--et-border-soft)] px-4 py-3 lg:hidden">
          <Link href="/app" className="et-serif text-base tracking-[0.18em] text-[var(--et-gold-bright)]">
            {brand}
          </Link>
          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() => setOpen(true)}
            className="rounded-full border border-[var(--et-border-soft)] p-2 text-[var(--et-text-muted)]"
          >
            <Icon d="M4 7h16M4 12h16M4 17h16" />
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
            <div
              className="absolute inset-0"
              style={{ background: "rgba(5,5,8,0.7)", backdropFilter: "blur(6px)" }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-[var(--et-border-soft)] bg-[var(--et-bg-elevated)] p-4"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              <div className="mb-8 flex items-center justify-between px-3 pt-2">
                <span className="et-serif text-lg tracking-[0.18em] text-[var(--et-gold-bright)]">{brand}</span>
                <button type="button" aria-label="Cerrar menú" onClick={() => setOpen(false)} className="p-1.5 text-[var(--et-text-faint)]">
                  <Icon d="M18 6 6 18M6 6l12 12" />
                </button>
              </div>
              <NavLinks items={nav} onNavigate={() => setOpen(false)} />
              <div className="mt-auto pt-6">
                <LogoutButton />
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
