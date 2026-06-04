import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

import { isClerkConfigured } from "@/lib/clerk";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0a0a0a] px-6 py-16">
      {isClerkConfigured() ? (
        <SignIn forceRedirectUrl="/home" signUpUrl="/sign-up" />
      ) : (
        <DemoNotice />
      )}
    </main>
  );
}

function DemoNotice() {
  return (
    <div className="max-w-sm text-center">
      <p className="font-serif text-2xl text-[#e8d9a8]">Entrada segura</p>
      <p className="mt-4 text-sm leading-relaxed text-[#d8d2c4]/80">
        La autenticación se activa en producción con Clerk. Esta es la vista de
        demostración.
      </p>
      <Link href="/" className="mt-8 inline-block text-sm text-[#e8d9a8] underline-offset-4 hover:underline">
        Volver al inicio
      </Link>
    </div>
  );
}
