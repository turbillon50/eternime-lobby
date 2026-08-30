import Link from "next/link";
import { AuthSheet } from "@/components/public/auth-sheet";
import { isClerkConfigured } from "@/lib/clerk";
export function PublicHeader(){return <header className="public-crystal-header"><Link href="/" className="public-brand"><span className="eon-mark"/><span><b>EON</b><small>ETERNIME</small></span></Link><nav><Link href="/como-funciona">Cómo funciona</Link><Link href="/eon">Eon</Link>{isClerkConfigured() ? <AuthSheet /> : <Link href="/sign-in" className="public-account-btn">Entrar</Link>}</nav></header>}
