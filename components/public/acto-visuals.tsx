"use client";

type Phase = "capture" | "learn" | "future" | "legacy";

const phaseData: Record<Phase, { step: string; label: string; focus: number }> = {
  capture: { step: "01", label: "CAPTURA", focus: 74 },
  learn: { step: "02", label: "CONTEXTO", focus: 146 },
  future: { step: "03", label: "TIEMPO", focus: 220 },
  legacy: { step: "04", label: "CONTINUIDAD", focus: 292 },
};

function ContinuumVisual({ phase }: { phase: Phase }) {
  const data = phaseData[phase];
  return <div className={`et-continuum-visual is-${phase}`} aria-hidden="true">
    <div className="et-continuum-meta"><span>{data.step}</span><b>{data.label}</b></div>
    <svg viewBox="0 0 360 220" className="h-full w-full" focusable="false">
      <defs>
        <linearGradient id={`flow-${phase}`} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#79e7ff" stopOpacity=".08"/>
          <stop offset=".28" stopColor="#8b5cff"/>
          <stop offset=".62" stopColor="#d653ff"/>
          <stop offset=".83" stopColor="#f4efe8"/>
          <stop offset="1" stopColor="#79e7ff" stopOpacity=".14"/>
        </linearGradient>
        <filter id={`flow-glow-${phase}`} x="-30%" y="-80%" width="160%" height="260%">
          <feGaussianBlur stdDeviation="3.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <path className="et-continuum-guide" d="M22 111H338"/>
      <path className="et-continuum-thread t1" d="M20 116C70 69 105 151 154 101S250 76 340 114" stroke={`url(#flow-${phase})`} filter={`url(#flow-glow-${phase})`}/>
      <path className="et-continuum-thread t2" d="M20 126C77 153 111 72 166 119S260 145 340 91" stroke={`url(#flow-${phase})`}/>
      <path className="et-continuum-thread t3" d="M20 96C79 127 118 78 174 123S270 82 340 127" stroke="#cfc2ff"/>
      {[74,146,220,292].map((x, index) => <g key={x} className={x === data.focus ? "is-focus" : ""}>
        <path className="et-continuum-slice" d={`M${x} 68V154`}/>
        <rect className="et-continuum-node" x={x - 4} y={104 + (index % 2 ? 9 : -5)} width="8" height="8" rx="1.5"/>
      </g>)}
      {phase === "capture" ? <g className="et-continuum-detail capture-bars">{[0,1,2,3,4,5].map(i=><rect key={i} x={46+i*10} y={174-(i%3)*6} width="3" height={10+(i%3)*6} rx="1.5"/>)}</g> : null}
      {phase === "learn" ? <g className="et-continuum-detail learn-branches"><path d="M146 112L116 172M146 112L176 172M146 112V182"/><rect x="112" y="170" width="7" height="7" rx="1"/><rect x="172" y="170" width="7" height="7" rx="1"/><rect x="142.5" y="179" width="7" height="7" rx="1"/></g> : null}
      {phase === "future" ? <g className="et-continuum-detail future-ticks">{[0,1,2,3,4].map(i=><path key={i} d={`M${190+i*16} 174V${184+(i%2)*7}`}/>)}</g> : null}
      {phase === "legacy" ? <g className="et-continuum-detail legacy-stream"><path d="M292 112C315 98 329 88 344 72"/><path d="M292 112C318 118 331 131 345 147"/><path d="M292 112H348"/></g> : null}
    </svg>
    <div className="et-continuum-caption"><span>ETERNIME</span><i/><span>MEMORIA EN MOVIMIENTO</span></div>
  </div>;
}

export function VisualHistoria(){return <ContinuumVisual phase="capture"/>}
export function VisualGuia(){return <ContinuumVisual phase="learn"/>}
export function VisualCartas(){return <ContinuumVisual phase="future"/>}
export function VisualTrasciende(){return <ContinuumVisual phase="legacy"/>}

const CSS = `
.et-continuum-visual{position:relative;width:100%;max-width:380px;aspect-ratio:1.28;margin-inline:auto;overflow:hidden;border:1px solid rgba(255,255,255,.1);border-radius:28px;background:linear-gradient(145deg,rgba(255,255,255,.05),rgba(255,255,255,.012) 42%,rgba(103,48,255,.035)),#050507;box-shadow:0 26px 80px rgba(0,0,0,.48),inset 0 1px rgba(255,255,255,.1);isolation:isolate}
.et-continuum-visual:before{content:"";position:absolute;inset:-30%;background:radial-gradient(circle at 35% 45%,rgba(139,92,255,.14),transparent 34%),radial-gradient(circle at 78% 54%,rgba(121,231,255,.055),transparent 30%);filter:blur(18px)}
.et-continuum-meta{position:absolute;z-index:2;top:20px;left:22px;right:22px;display:flex;align-items:center;justify-content:space-between;font-size:9px;letter-spacing:.2em}.et-continuum-meta span{color:#f4efe8}.et-continuum-meta b{color:#8d8497;font-weight:600}
.et-continuum-guide{fill:none;stroke:rgba(255,255,255,.055);stroke-width:1}.et-continuum-thread{fill:none;stroke-width:1.5;stroke-linecap:round;stroke-dasharray:9 10;animation:etContinuum 9s linear infinite}.et-continuum-thread.t2{opacity:.64;animation-duration:13s;animation-direction:reverse}.et-continuum-thread.t3{opacity:.24;stroke-width:.8;animation-duration:17s}
.et-continuum-slice{stroke:rgba(255,255,255,.065);stroke-width:1;stroke-dasharray:2 6}.et-continuum-node{fill:#777181;transition:fill .3s ease,filter .3s ease}.et-continuum-visual g.is-focus .et-continuum-slice{stroke:rgba(139,92,255,.5)}.et-continuum-visual g.is-focus .et-continuum-node{fill:#f4efe8;filter:drop-shadow(0 0 8px #8b5cff)}
.et-continuum-detail{fill:#a98cff;stroke:#a98cff;stroke-width:1;opacity:.72}.et-continuum-detail path{fill:none}.legacy-stream path{animation:etLegacy 3.8s ease-in-out infinite alternate}.et-continuum-caption{position:absolute;z-index:2;left:22px;right:22px;bottom:18px;display:flex;align-items:center;gap:9px;color:#615b68;font-size:7px;letter-spacing:.15em}.et-continuum-caption i{height:1px;flex:1;background:linear-gradient(90deg,rgba(139,92,255,.45),rgba(121,231,255,.08))}
@keyframes etContinuum{to{stroke-dashoffset:-190}}@keyframes etLegacy{to{transform:translateX(5px);opacity:.35}}
@media(prefers-reduced-motion:reduce){.et-continuum-thread,.legacy-stream path{animation:none}}
`;

export function ActoVisualStyles(){return <style dangerouslySetInnerHTML={{__html:CSS}}/>}
