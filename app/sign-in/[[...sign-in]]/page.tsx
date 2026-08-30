import Link from "next/link";
import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

import { isClerkConfigured } from "@/lib/clerk";
import { eternimeClerkAppearance } from "@/lib/clerk-appearance";
import { safeInternalRedirect } from "@/lib/safe-redirect";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const destination = safeInternalRedirect(params.redirect_url);

  if (isClerkConfigured()) {
    const { userId } = await auth();
    if (userId) redirect(destination);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#08080c] px-6 py-16">
      {isClerkConfigured() ? (
        <SignIn appearance={eternimeClerkAppearance} forceRedirectUrl={destination} signUpUrl="/sign-up" />
      ) : (
        <DemoNotice />
      )}
    </main>
  );
}

function DemoNotice() {
  return (
    <div className="max-w-sm text-center">
      <p className="text-2xl font-semibold text-[#f7f5ff]">Entrada segura</p>
      <p className="mt-4 text-sm leading-relaxed text-[#aaa5b6]">
        La autenticación se activa en producción con Clerk. Esta es la vista de
        demostración.
      </p>
      <Link href="/" className="mt-8 inline-block text-sm text-[#bda9ff] underline-offset-4 hover:underline">
        Volver al inicio
      </Link>
    </div>
  );
}
