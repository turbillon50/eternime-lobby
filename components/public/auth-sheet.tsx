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
    return <div className="public-account-btn is-loading" aria-hidden>Cuenta</div>;
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
        className="public-account-btn"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />
        </svg><span>Entrar</span>
      </button>
    </SignInButton>
  );
}
