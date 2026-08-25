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
    return <span className="public-entrar" data-ghost aria-hidden>Entrar</span>;
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
      <button type="button" aria-label="Entrar a tu cuenta" className="public-entrar">
        Entrar
      </button>
    </SignInButton>
  );
}
