"use client";
import Link from "next/link";
import { AuthSheet } from "@/components/public/auth-sheet";
export function PublicHeader(){return <header className="public-crystal-header"><Link href="/" className="public-brand"><span className="eon-mini-orb"/><span><b>EON</b><small>ETERNIME</small></span></Link><nav><Link href="/como-funciona">Cómo funciona</Link><Link href="/eon">Eon</Link><AuthSheet /></nav></header>}
