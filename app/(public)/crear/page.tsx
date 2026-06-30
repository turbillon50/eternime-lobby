import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { eternimeClerkAppearance } from "@/lib/clerk-appearance";

export const metadata: Metadata = { title: "Crear mi legado" };

export default function CrearPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-5 py-10">
      <div className="w-full max-w-md text-center">
        <div className="et-glow-ring et-pulse mx-auto mb-6 h-16 w-16 rounded-full" />
        <h1 className="et-serif text-3xl text-[var(--et-text)]">Crea tu legado</h1>
        <p className="mt-2 text-sm text-[var(--et-text-muted)]">Cada vida deja una huella. Empieza a preservar la tuya.</p>
        <div className="mt-8 flex justify-center">
          <SignUp
            appearance={eternimeClerkAppearance}
            forceRedirectUrl="/app/perfil?welcome=1"
            signInUrl="/entrar"
          />
        </div>
      </div>
    </div>
  );
}
