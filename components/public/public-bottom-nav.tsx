"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useT } from "@/components/i18n";
import type { DictKey } from "@/lib/i18n";

function I({ d }: { d: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>;
}

const TABS: { href: string; label: DictKey; icon: ReactNode; center?: boolean }[] = [
  { href: "/explora", label: "pubnav.explore", icon: <I d="M4 5h16v14H4zM4 9h16M9 5v4M9 13h6" /> },
  { href: "/como-funciona", label: "pubnav.how", icon: <I d="M12 3a7 7 0 0 1 7 7c0 2.4-1.2 4-2.5 5.4-.8.8-1.5 2-1.5 3.1V20h-6v-1.5c0-1.1-.7-2.3-1.5-3.1C6.2 14 5 12.4 5 10a7 7 0 0 1 7-7ZM10 22h4" /> },
  { href: "/eon", label: "pubnav.eon", icon: <I d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3ZM5 11a7 7 0 0 0 14 0M12 18v3" />, center: true },
  { href: "/precios", label: "pubnav.prices", icon: <I d="M3 7h18v10H3zM3 11h18M7 15h4" /> },
  { href: "/entrar", label: "pubnav.enter", icon: <I d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 0 1 16 0" /> },
];

export function PublicBottomNav() {
  const pathname = usePathname();
  const t = useT();
  return (
    <nav className="et-bottom-nav lg:hidden" aria-label="Navegación">
      {TABS.map((tab) => {
        const active = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
        if (tab.center) {
          return (
            <Link key={tab.href} href={tab.href} className="et-bottom-center" aria-label={t(tab.label)}>
              <span className="et-bottom-center-btn" style={{ boxShadow: active ? "var(--et-glow-strong)" : "var(--et-glow)" }}>{tab.icon}</span>
            </Link>
          );
        }
        return (
          <Link key={tab.href} href={tab.href} className={`et-bottom-item ${active ? "et-bottom-item-active" : ""}`}>
            {tab.icon}
            <span className="et-bottom-label">{t(tab.label)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
