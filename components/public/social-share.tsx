"use client";

import { useState } from "react";

const SHARE_URL = "https://eternime.org/videos";
const SHARE_TEXT = "Eternime: tu hogar de memoria.";

export function SocialShare() {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(SHARE_URL);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: SHARE_TEXT, text: SHARE_TEXT, url: SHARE_URL });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    await copyLink();
  }

  const encodedUrl = encodeURIComponent(SHARE_URL);
  const encodedText = encodeURIComponent(SHARE_TEXT);

  return (
    <div className="official-social-share" aria-label="Compartir Eternime">
      <button type="button" onClick={share} className="official-share-primary">
        <span aria-hidden>↗</span>
        Compartir
      </button>
      <a
        href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Compartir por WhatsApp"
      >
        WhatsApp
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Compartir en Facebook"
      >
        Facebook
      </a>
      <a
        href={`https://x.com/intent/post?text=${encodedText}&url=${encodedUrl}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Compartir en X"
      >
        X
      </a>
      <button type="button" onClick={copyLink} aria-live="polite">
        {copied ? "Enlace copiado" : "Copiar enlace"}
      </button>
    </div>
  );
}
