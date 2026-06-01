import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

import { isClerkConfigured } from "@/lib/clerk";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0a0a0a] px-6 py-16">
      {isClerkConfigured() ? (
        <SignUp forceRedirectUrl="/onboarding" signInUrl="/sign-in" />
      ) : (
        <div className="max-w-sm text-center">
          <p className="font-serif text-2xl text-[#e8d9a8]">Crear mi Eternime</p>
          <p className="mt-4 text-sm leading-relaxed text-[#d8d2c4]/80">
            El registro se activa en producción con Clerk. Esta es la vista de
            demostración.
          </p>
          <Link href="/" className="mt-8 inline-block text-sm text-[#e8d9a8] underline-offset-4 hover:underline">
            Volver al inicio
          </Link>
        </div>
      )}
    </main>
  );
}
