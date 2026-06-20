"use client";

import { createContext, useContext, type PropsWithChildren } from "react";
import { dict, translate, type DictKey, type Lang } from "@/lib/i18n";

const I18nContext = createContext<Lang>("es");

export function I18nProvider({ lang, children }: PropsWithChildren<{ lang: Lang }>) {
  return <I18nContext.Provider value={lang}>{children}</I18nContext.Provider>;
}

export function useLang(): Lang {
  return useContext(I18nContext);
}

export function useT(): (key: DictKey) => string {
  const lang = useContext(I18nContext);
  return (key: DictKey) => translate(lang, key);
}

export { dict };
