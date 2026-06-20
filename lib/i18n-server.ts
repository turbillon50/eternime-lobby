import { cookies } from "next/headers";
import type { Lang } from "@/lib/i18n";

export async function getServerLang(): Promise<Lang> {
  const store = await cookies();
  return store.get("eternime-lang")?.value === "en" ? "en" : "es";
}
