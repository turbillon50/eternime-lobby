"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, background: "#000" }}>
        <main
          style={{
            minHeight: "100svh",
            display: "grid",
            placeItems: "center",
            padding: "1.5rem",
            background:
              "radial-gradient(55% 45% at 20% 10%,rgba(109,54,255,.22),transparent 70%),radial-gradient(45% 40% at 85% 88%,rgba(52,32,111,.34),transparent 72%),#000000",
            color: "#f4efe8",
            fontFamily: "ui-sans-serif,system-ui,-apple-system,sans-serif",
            textAlign: "center",
          }}
        >
          <div>
            {/* EON en contracción sutil: energía mínima pero reconocible */}
            <div
              style={{
                width: 74,
                height: 74,
                borderRadius: "50%",
                margin: "0 auto 24px",
                background:
                  "radial-gradient(circle at 36% 30%, rgba(244,239,232,.85) 0%, rgba(139,92,255,.5) 20%, rgba(109,54,255,.4) 44%, rgba(52,32,111,.5) 64%, rgba(0,0,0,.92) 84%)",
                boxShadow: "inset 0 0 24px rgba(0,0,0,.85), 0 0 34px -6px rgba(109,54,255,.6)",
              }}
            />
            <h1 style={{ margin: 0, fontSize: "1.55rem", letterSpacing: "-.045em", fontWeight: 560 }}>
              Algo se desconectó por un momento.
            </h1>
            <p style={{ margin: "10px auto 0", maxWidth: 360, color: "#96929f", lineHeight: 1.55, fontSize: 14 }}>
              Tu información sigue segura. Podemos intentar cargar Eternime de nuevo.
            </p>
            <button
              onClick={() => reset()}
              style={{
                marginTop: "1.6rem",
                minHeight: 46,
                padding: "0 1.4rem",
                border: "1px solid rgba(139,92,255,.5)",
                borderRadius: 999,
                background: "linear-gradient(150deg,#8b5cff,#6d36ff 74%)",
                color: "#fff",
                fontWeight: 550,
                cursor: "pointer",
                boxShadow: "0 12px 30px -10px rgba(109,54,255,.9)",
              }}
            >
              Intentar de nuevo
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
