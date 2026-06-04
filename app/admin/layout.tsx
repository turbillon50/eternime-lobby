import { AppShell, type NavItem } from "@/components/shell/app-shell";

const adminNav: NavItem[] = [
  {
    href: "/admin",
    label: "Panel",
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
        <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 11h7v9h-7zM4 14h7v6H4z" />
      </svg>
    ),
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell nav={adminNav} brand="ETERNIME · ADMIN">
      {children}
    </AppShell>
  );
}
