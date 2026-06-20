import Link from "next/link";

export default function NotFound() {
  return (
    <main className="et-surface flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.4em] text-[var(--et-gold-dim)]">Eternime</p>
      <h1 className="et-serif mt-6 text-6xl text-[var(--et-text)]">404</h1>
      <p className="mt-4 max-w-md text-[var(--et-text-muted)]">
        Esta página se perdió en el tiempo. Tu legado, en cambio, sigue a salvo.
      </p>
      <Link href="/" className="et-btn et-btn-secondary mt-8 px-6">Volver al inicio</Link>
    </main>
  );
}
