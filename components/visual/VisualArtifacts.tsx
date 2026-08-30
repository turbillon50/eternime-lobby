import { useId } from "react";
import type { HTMLAttributes, PropsWithChildren } from "react";

type Props = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export function CrystalSurface({children,className="",...rest}:Props){return <div className={`va-crystal ${className}`} {...rest}>{children}</div>}
export function SpatialFrame({children,className="",...rest}:Props){return <div className={`va-spatial ${className}`} {...rest}>{children}</div>}
export function LivingMesh({className=""}:{className?:string}){return <div className={`va-mesh ${className}`} aria-hidden="true"><i/><i/><i/></div>}
export function PresenceHalo({className=""}:{className?:string}){return <div className={`va-halo ${className}`} aria-hidden="true"/>}
export function LightSweep({className=""}:{className?:string}){return <div className={`va-sweep ${className}`} aria-hidden="true"/>}

export type EonState = "idle" | "listening" | "thinking" | "acting" | "success" | "error" | "offline";

export function EonSignal({ state = "idle", className = "", label = "EON, inteligencia activa" }: { state?: EonState; className?: string; label?: string }) {
  const seed = useId().replace(/:/g, "");
  const energy = `${seed}-energy`;
  const glow = `${seed}-glow`;

  return <div className={`eon-signal eon-signal--${state} ${className}`} role="img" aria-label={label}>
    <span className="eon-signal__field" aria-hidden="true" />
    <svg viewBox="0 0 420 132" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={energy} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#79e7ff" stopOpacity=".1" />
          <stop offset=".28" stopColor="#8b5cff" />
          <stop offset=".62" stopColor="#d653ff" />
          <stop offset=".86" stopColor="#f4efe8" />
          <stop offset="1" stopColor="#ffa851" stopOpacity=".16" />
        </linearGradient>
        <filter id={glow} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4.2" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <path className="eon-signal__ghost" d="M4 67C70 20 108 114 172 59S286 29 416 70" />
      <path className="eon-signal__current eon-signal__current--one" d="M4 67C70 20 108 114 172 59S286 29 416 70" stroke={`url(#${energy})`} filter={`url(#${glow})`} />
      <path className="eon-signal__current eon-signal__current--two" d="M3 86C68 121 112 18 183 73S307 116 417 47" stroke={`url(#${energy})`} />
      <path className="eon-signal__current eon-signal__current--three" d="M0 51C76 88 119 29 184 80S309 37 420 88" stroke="#cfc2ff" />
      <g className="eon-signal__memory">
        <rect x="77" y="41" width="5" height="5" rx="1" fill="#79e7ff" />
        <rect x="169" y="57" width="7" height="7" rx="1.5" fill="#f4efe8" />
        <rect x="272" y="50" width="5" height="5" rx="1" fill="#d653ff" />
        <rect x="353" y="68" width="4" height="4" rx="1" fill="#ffa851" />
      </g>
      <path className="eon-signal__scan" d="M126 8V124" />
    </svg>
  </div>;
}
