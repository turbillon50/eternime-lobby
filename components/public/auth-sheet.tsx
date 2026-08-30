"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";

/**
 * Icono de cuenta en el header publico. Sesion cerrada: abre el modal de
 * Clerk para entrar (sin salir de la pagina). Sesion activa: avatar real
 * de Clerk con menu (perfil de Eternime, cerrar sesion).
 *
 * Nota: Clerk v7 quito SignedIn/SignedOut como exportes — se usa useUser()
 * directamente, mas simple y estable entre versiones mayores.
 */
export function AuthSheet() {
  const { isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn && pathname === "/") router.replace("/app");
  }, [isLoaded, isSignedIn, pathname, router]);

  if (!isLoaded) {
    return <div className="public-account-btn is-loading" aria-hidden>Cuenta</div>;
  }

  if (isSignedIn) {
    return (
      <>
        <Link href="/app" className="public-account-btn public-app-entry" aria-label="Abrir Eon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg><span>Abrir Eon</span>
        </Link>
        <UserButton>
          <UserButton.MenuItems>
            <UserButton.Link label="Mi legado" href="/app" labelIcon={<span aria-hidden>✦</span>} />
          </UserButton.MenuItems>
        </UserButton>
      </>
    );
  }

  return (
    <Link href="/sign-in" aria-label="Entrar a tu cuenta" className="public-account-btn">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />
      </svg><span>Entrar</span>
    </Link>
  );
}
