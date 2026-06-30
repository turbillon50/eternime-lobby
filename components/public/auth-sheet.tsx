"use client";

import { useUser, SignInButton, UserButton } from "@clerk/nextjs";

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

  if (!isLoaded) {
    return <div className="h-10 w-10 rounded-full border border-[var(--et-border-soft)]" aria-hidden />;
  }

  if (isSignedIn) {
    return (
      <UserButton>
        <UserButton.MenuItems>
          <UserButton.Link label="Mi legado" href="/app" labelIcon={<span aria-hidden>✦</span>} />
        </UserButton.MenuItems>
      </UserButton>
    );
  }

  return (
    <SignInButton mode="modal">
      <button
        type="button"
        aria-label="Entrar a tu cuenta"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--et-border)] text-[var(--et-gold-bright)] transition hover:bg-[rgba(255,255,255,0.1)]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      </button>
    </SignInButton>
  );
}
