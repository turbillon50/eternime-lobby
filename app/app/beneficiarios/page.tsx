import type { Metadata } from "next";
import { FadeInOnScroll } from "@/components/motion";
import { BeneficiariosClient } from "@/components/app/BeneficiariosClient";
import { translate } from "@/lib/i18n";
import { getServerLang } from "@/lib/i18n-server";

export const metadata: Metadata = { title: "Herederos" };

export default async function HerederosPage() {
  const lang = await getServerLang();
  return (
    <div className="grid gap-6">
      <FadeInOnScroll>
        <h1 className="et-serif text-2xl text-[var(--et-text)]">{translate(lang, "heirs.title")}</h1>
        <p className="mt-1 text-sm text-[var(--et-text-muted)]">{translate(lang, "heirs.sub")}</p>
      </FadeInOnScroll>
      <BeneficiariosClient />
    </div>
  );
}
