import { AppShell, type NavItem } from "@/components/shell/app-shell";

function Icon({ d }: { d: string }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

const adminNav: NavItem[] = [
  { href: "/admin", label: "Panel", icon: <Icon d="M4 4h7v7H4zM13 4h7v4h-7zM13 11h7v9h-7zM4 14h7v6H4z" /> },
  { href: "/admin/usuarios", label: "Usuarios", icon: <Icon d="M16 11a4 4 0 1 0-8 0M12 7a4 4 0 1 0 0-8M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /> },
  { href: "/admin/contenido", label: "Contenido", icon: <Icon d="M4 5h16v14H4zM4 9h16M8 5v4" /> },
  { href: "/admin/cartas", label: "Cola de cartas", icon: <Icon d="M4 6h16v12H4zM4 7l8 6 8-6" /> },
  { href: "/admin/sistema", label: "Sistema", icon: <Icon d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8.5 4c0 .5 0 .9-.1 1.3l2 1.5-2 3.4-2.3-.9a8.6 8.6 0 0 1-2.2 1.3l-.4 2.4h-4l-.4-2.4a8.6 8.6 0 0 1-2.2-1.3l-2.3.9-2-3.4 2-1.5a8.5 8.5 0 0 1 0-2.6l-2-1.5 2-3.4 2.3.9a8.6 8.6 0 0 1 2.2-1.3l.4-2.4h4l.4 2.4a8.6 8.6 0 0 1 2.2 1.3l2.3-.9 2 3.4-2 1.5c.1.4.1.9.1 1.4Z" /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell nav={adminNav} brand="ETERNIME · ADMIN">
      {children}
    </AppShell>
  );
}
