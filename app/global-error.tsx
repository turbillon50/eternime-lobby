"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es" data-theme="dark">
      <body style={{ margin: 0 }}>
        <main style={{ minHeight: "100svh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "1.5rem", background: "#0a0a0f", color: "#f5f2ea", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
          <p style={{ fontFamily: "monospace", fontSize: "0.7rem", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(212,175,106,0.55)" }}>Eternime</p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "2.5rem", marginTop: "1.2rem" }}>Algo se interrumpió</h1>
          <p style={{ marginTop: "1rem", maxWidth: "28rem", color: "rgba(245,242,234,0.62)" }}>
            Tuvimos un problema momentáneo. Tu legado está seguro. Intenta de nuevo.
          </p>
          <button onClick={() => reset()} style={{ marginTop: "2rem", padding: "0.8rem 1.6rem", borderRadius: "999px", border: "1px solid #d4af6a", background: "linear-gradient(135deg,#d4af6a,#e8c87e)", color: "#0a0a0f", cursor: "pointer" }}>
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
