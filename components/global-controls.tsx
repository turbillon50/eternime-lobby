"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";
type Lang = "es" | "en";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
}

export function GlobalControls() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [lang, setLang] = useState<Lang>("es");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const t = (root.dataset.theme as Theme) || (localStorage.getItem("eternime-theme") as Theme) || "dark";
    const l = (root.getAttribute("lang") as Lang) || (localStorage.getItem("eternime-lang") as Lang) || "es";
    setTheme(t === "light" ? "light" : "dark");
    setLang(l === "en" ? "en" : "es");
    setMounted(true);
  }, []);

  const applyTheme = (t: Theme) => {
    setTheme(t);
    document.documentElement.dataset.theme = t;
    localStorage.setItem("eternime-theme", t);
    setCookie("eternime-theme", t);
  };

  const applyLang = (l: Lang) => {
    if (l === lang) return;
    setLang(l);
    localStorage.setItem("eternime-lang", l);
    setCookie("eternime-lang", l);
    document.documentElement.setAttribute("lang", l);
    // Recarga para que el contenido server-rendered tome el idioma de la cookie.
    window.location.reload();
  };

  if (!mounted) return null;

  return (
    <div className="et-fab" role="group" aria-label="Ajustes de tema e idioma">
      <button
        type="button"
        aria-label={theme === "dark" ? "Cambiar a modo día" : "Cambiar a modo noche"}
        onClick={() => applyTheme(theme === "dark" ? "light" : "dark")}
        title={theme === "dark" ? "Modo día" : "Modo noche"}
      >
        {theme === "dark" ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
          </svg>
        )}
      </button>
      <span className="et-fab-sep" />
      <button type="button" data-active={lang === "es"} onClick={() => applyLang("es")} aria-label="Español">ES</button>
      <button type="button" data-active={lang === "en"} onClick={() => applyLang("en")} aria-label="English">EN</button>
    </div>
  );
}
