import { PublicHeader } from "@/components/public/public-header";
import { SiteFooter } from "@/components/public/site-footer";

/** Renderiza un documento legal: 1er bloque = título, resto = secciones. */
export function LegalDoc({ raw }: { raw: string }) {
  const blocks = raw.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="et-surface flex min-h-svh flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
        {blocks.map((block, i) => {
          if (i === 0) {
            return (
              <p key={i} className="mb-8 rounded-[var(--et-radius-sm)] border border-[var(--et-border-soft)] bg-[rgba(212,175,106,0.05)] px-4 py-3 text-xs uppercase tracking-[0.14em] text-[var(--et-gold-dim)]">
                {block}
              </p>
            );
          }
          const lines = block.split("\n");
          // Bloque "título de sección": una sola línea corta sin punto final.
          const isHeading = lines.length === 1 && block.length < 70 && !/[.:]$/.test(block);
          if (i === 1) {
            return <h1 key={i} className="et-serif text-3xl text-[var(--et-text)] sm:text-4xl">{lines[0]}</h1>;
          }
          if (i === 2) {
            return <p key={i} className="mt-2 text-sm text-[var(--et-text-faint)]">{block}</p>;
          }
          if (isHeading) {
            return <h2 key={i} className="et-serif mt-8 text-xl text-[var(--et-gold-bright)]">{block}</h2>;
          }
          return <p key={i} className="mt-3 leading-relaxed text-[var(--et-text-muted)]">{block}</p>;
        })}
      </main>
      <SiteFooter />
    </div>
  );
}
