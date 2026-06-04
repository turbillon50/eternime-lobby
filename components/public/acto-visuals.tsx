"use client";

function GoldDefs({ id }: { id: string }) {
  return (
    <defs>
      <radialGradient id={id} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="var(--et-gold-bright)" stopOpacity="0.9" />
        <stop offset="100%" stopColor="var(--et-gold)" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

/** Acto 1 - Cuenta tu historia. */
export function VisualHistoria() {
  return (
    <div className="et-acto-visual">
      <svg viewBox="0 0 240 240" className="h-full w-full" aria-hidden="true">
        <GoldDefs id="g-historia" />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx="120" cy="120" r="30" fill="none" stroke="var(--et-gold)" strokeWidth="1" className="et-anim-ripple" style={{ animationDelay: i * 1.3 + "s" }} />
        ))}
        <circle cx="120" cy="120" r="40" fill="url(#g-historia)" className="et-anim-breathe" />
        <circle cx="120" cy="120" r="6" fill="var(--et-gold-bright)" />
        {[-28, -14, 0, 14, 28].map((x, i) => (
          <rect key={x} x={120 + x - 2} y="166" width="4" rx="2" height="14" fill="var(--et-gold)" opacity="0.7" className="et-anim-wave" style={{ animationDelay: i * 0.15 + "s" }} />
        ))}
      </svg>
    </div>
  );
}

/** Acto 2 - Tu guía aprende de ti. */
export function VisualGuia() {
  return (
    <div className="et-acto-visual">
      <svg viewBox="0 0 240 240" className="h-full w-full" aria-hidden="true">
        <GoldDefs id="g-guia" />
        <circle cx="120" cy="120" r="34" fill="url(#g-guia)" className="et-anim-breathe" />
        <g className="et-anim-spin-slow" style={{ transformOrigin: "120px 120px" }}>
          <circle cx="120" cy="120" r="78" fill="none" stroke="var(--et-border)" strokeWidth="1" />
          <circle cx="198" cy="120" r="4" fill="var(--et-gold-bright)" />
        </g>
        <g className="et-anim-spin-reverse" style={{ transformOrigin: "120px 120px" }}>
          <circle cx="120" cy="120" r="56" fill="none" stroke="var(--et-border)" strokeWidth="1" strokeDasharray="3 6" />
          <circle cx="64" cy="120" r="3" fill="var(--et-gold)" />
          <circle cx="176" cy="120" r="3" fill="var(--et-gold)" />
        </g>
        <circle cx="120" cy="120" r="10" fill="none" stroke="var(--et-gold-bright)" strokeWidth="1.5" className="et-anim-breathe" />
        <circle cx="120" cy="120" r="4" fill="var(--et-gold-bright)" />
      </svg>
    </div>
  );
}

/** Acto 3 - Cartas al futuro: linea de tiempo con sobres. */
export function VisualCartas() {
  const hitos = [40, 95, 150, 205];
  return (
    <div className="et-acto-visual">
      <svg viewBox="0 0 240 240" className="h-full w-full" aria-hidden="true">
        <GoldDefs id="g-cartas" />
        <line x1="20" y1="120" x2="220" y2="120" stroke="var(--et-border)" strokeWidth="1.5" />
        {hitos.map((x, i) => (
          <g key={x}>
            <circle cx={x} cy="120" r="6" fill="var(--et-bg)" stroke="var(--et-gold)" strokeWidth="1.5" className="et-anim-glowpulse" style={{ animationDelay: i * 0.9 + "s" }} />
            <g className="et-anim-float" style={{ animationDelay: i * 0.9 + "s" }}>
              <Sobre x={x} y={i % 2 === 0 ? 78 : 140} />
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}

function Sobre({ x, y }: { x: number; y: number }) {
  const d = "M " + (x - 11) + " " + (y + 2) + " L " + x + " " + (y + 10) + " L " + (x + 11) + " " + (y + 2);
  return (
    <g>
      <rect x={x - 11} y={y} width="22" height="15" rx="2" fill="none" stroke="var(--et-gold)" strokeWidth="1.2" />
      <path d={d} fill="none" stroke="var(--et-gold)" strokeWidth="1.2" />
    </g>
  );
}

/** Acto 4 - Trasciende: constelacion que asciende hacia la luz. */
export function VisualTrasciende() {
  const particulas: Array<[number, number]> = [
    [60, 200], [180, 195], [95, 175], [150, 160], [70, 145],
    [170, 130], [110, 120], [140, 95], [100, 80], [125, 55],
  ];
  return (
    <div className="et-acto-visual">
      <svg viewBox="0 0 240 240" className="h-full w-full" aria-hidden="true">
        <GoldDefs id="g-tras" />
        <circle cx="120" cy="40" r="34" fill="url(#g-tras)" className="et-anim-breathe" />
        <circle cx="120" cy="40" r="5" fill="var(--et-gold-bright)" />
        <path d="M 60 200 L 95 175 L 110 120 L 140 95 L 125 55 L 120 40" fill="none" stroke="var(--et-border)" strokeWidth="0.8" />
        <path d="M 180 195 L 170 130 L 140 95" fill="none" stroke="var(--et-border)" strokeWidth="0.8" />
        {particulas.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 3 : 2} fill={i % 2 === 0 ? "var(--et-gold-bright)" : "var(--et-gold)"} className="et-anim-ascend" style={{ animationDelay: i * 0.55 + "s" }} />
        ))}
      </svg>
    </div>
  );
}

const CSS = [
  ".et-acto-visual { width: 100%; max-width: 320px; aspect-ratio: 1; margin-inline: auto; border-radius: var(--et-radius); border: 1px solid var(--et-border-soft); background: radial-gradient(circle at 50% 50%, rgba(212,175,106,0.06), transparent 70%), var(--et-bg-elevated); box-shadow: var(--et-glow); }",
  "@keyframes et-ripple { 0% { r: 30; opacity: 0.8; } 100% { r: 95; opacity: 0; } }",
  ".et-anim-ripple { animation: et-ripple 4s ease-out infinite; }",
  "@keyframes et-breathe { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }",
  ".et-anim-breathe { animation: et-breathe 3.5s ease-in-out infinite; }",
  "@keyframes et-wave { 0%, 100% { transform: scaleY(0.5); } 50% { transform: scaleY(1.4); } }",
  ".et-anim-wave { transform-box: fill-box; transform-origin: center; animation: et-wave 1.2s ease-in-out infinite; }",
  "@keyframes et-spin { to { transform: rotate(360deg); } }",
  ".et-anim-spin-slow { animation: et-spin 18s linear infinite; }",
  ".et-anim-spin-reverse { animation: et-spin 12s linear infinite reverse; }",
  "@keyframes et-glowpulse { 0%, 100% { fill: var(--et-bg); } 50% { fill: var(--et-gold-bright); } }",
  ".et-anim-glowpulse { animation: et-glowpulse 3.6s ease-in-out infinite; }",
  "@keyframes et-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }",
  ".et-anim-float { animation: et-float 4s ease-in-out infinite; }",
  "@keyframes et-ascend { 0% { transform: translateY(0); opacity: 0.2; } 50% { opacity: 1; } 100% { transform: translateY(-26px); opacity: 0; } }",
  ".et-anim-ascend { animation: et-ascend 5.5s ease-in-out infinite; }",
  "@media (prefers-reduced-motion: reduce) { .et-anim-ripple, .et-anim-breathe, .et-anim-wave, .et-anim-spin-slow, .et-anim-spin-reverse, .et-anim-glowpulse, .et-anim-float, .et-anim-ascend { animation: none; } }",
].join(" ");

/** Estilos de animacion compartidos (inyectar una vez por pagina). */
export function ActoVisualStyles() {
  return <style dangerouslySetInnerHTML={{ __html: CSS }} />;
}
