import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { eternimeClerkAppearance } from "@/lib/clerk-appearance";

export const metadata: Metadata = { title: "Entrar" };

export default function EntrarPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-5 py-10">
      <div className="w-full max-w-md text-center">
        <div className="et-glow-ring et-pulse mx-auto mb-6 h-16 w-16 rounded-full" />
        <h1 className="et-serif text-3xl text-[var(--et-text)]">Bienvenido de vuelta</h1>
        <p className="mt-2 text-sm text-[var(--et-text-muted)]">Tu legado te estaba esperando.</p>
        <div className="mt-8 flex justify-center">
          <SignIn
            appearance={eternimeClerkAppearance}
            forceRedirectUrl="/app"
            signUpUrl="/crear"
          />
        </div>
      </div>
    </div>
  );
}
