import { PageTransition } from "@/components/motion";
import { PublicHeader } from "@/components/public/public-header";
import { SiteFooter } from "@/components/public/site-footer";
export default function PublicLayout({ children }: { children: React.ReactNode }) {return <div className="eon-public-shell min-h-svh"><PublicHeader/><main><PageTransition>{children}</PageTransition></main><SiteFooter/></div>}
