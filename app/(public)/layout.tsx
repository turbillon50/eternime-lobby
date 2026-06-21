import { PageTransition } from "@/components/motion";
import { PublicHeader } from "@/components/public/public-header";
import { SiteFooter } from "@/components/public/site-footer";
import { PublicBottomNav } from "@/components/public/public-bottom-nav";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="et-surface flex min-h-svh flex-col">
      <PublicHeader />
      <main className="flex flex-1 flex-col pb-28 lg:pb-0">
        <PageTransition>{children}</PageTransition>
      </main>
      <div className="hidden lg:block"><SiteFooter /></div>
      <PublicBottomNav />
    </div>
  );
}
