import { useId } from "react";
import type { HTMLAttributes, PropsWithChildren } from "react";

type Props = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export function CrystalSurface({children,className="",...rest}:Props){return <div className={`va-crystal ${className}`} {...rest}>{children}</div>}
export function SpatialFrame({children,className="",...rest}:Props){return <div className={`va-spatial ${className}`} {...rest}>{children}</div>}
export function LivingMesh({className=""}:{className?:string}){return <div className={`va-mesh ${className}`} aria-hidden="true"><i/><i/><i/></div>}
export function PresenceHalo({className=""}:{className?:string}){return <div className={`va-halo ${className}`} aria-hidden="true"/>}
export function LightSweep({className=""}:{className?:string}){return <div className={`va-sweep ${className}`} aria-hidden="true"/>}

export type EonState = "idle" | "listening" | "thinking" | "acting" | "success" | "error" | "offline";

export function EonOrb({ state = "idle", className = "", label = "EON, tu memoria viva" }: { state?: EonState; className?: string; label?: string }) {
  const seed = useId().replace(/:/g, "");
  const core = `${seed}-core`;
  const energy = `${seed}-energy`;
  const glass = `${seed}-glass`;
  const glow = `${seed}-glow`;

  return <div className={`eon-orb eon-orb--${state} ${className}`} role="img" aria-label={label}>
    <span className="eon-orb__aura" aria-hidden="true" />
    <svg viewBox="0 0 180 180" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={core} cx="37%" cy="28%" r="74%">
          <stop offset="0" stopColor="#f8f5ff" stopOpacity=".92" />
          <stop offset=".16" stopColor="#b9a6ff" stopOpacity=".78" />
          <stop offset=".43" stopColor="#7545ff" stopOpacity=".54" />
          <stop offset=".72" stopColor="#170b38" stopOpacity=".82" />
          <stop offset="1" stopColor="#010104" />
        </radialGradient>
        <linearGradient id={energy} x1="15%" y1="12%" x2="86%" y2="91%">
          <stop stopColor="#7ce9ff" />
          <stop offset=".34" stopColor="#7b46ff" />
          <stop offset=".68" stopColor="#d55cff" />
          <stop offset="1" stopColor="#ff9f45" />
        </linearGradient>
        <linearGradient id={glass} x1="22%" y1="7%" x2="78%" y2="96%">
          <stop stopColor="#fff" stopOpacity=".72" />
          <stop offset=".24" stopColor="#c9e8ff" stopOpacity=".12" />
          <stop offset=".7" stopColor="#5b2fd4" stopOpacity=".06" />
          <stop offset="1" stopColor="#fff" stopOpacity=".28" />
        </linearGradient>
        <filter id={glow} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.4" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="1 0 0 0 .22  0 1 0 0 .05  0 0 1 0 .7  0 0 0 .9 0" />
        </filter>
        <clipPath id={`${seed}-clip`}><circle cx="90" cy="90" r="68" /></clipPath>
      </defs>

      <circle className="eon-orb__shadow" cx="90" cy="93" r="69" />
      <circle className="eon-orb__body" cx="90" cy="90" r="68" fill={`url(#${core})`} />
      <g clipPath={`url(#${seed}-clip)`}>
        <path className="eon-orb__current eon-orb__current--one" d="M8 107C39 44 72 133 104 60c18-40 45-26 70-7" fill="none" stroke={`url(#${energy})`} strokeWidth="3.2" />
        <path className="eon-orb__current eon-orb__current--two" d="M13 72c40 48 55-42 95 10 21 27 41 22 66-10" fill="none" stroke={`url(#${energy})`} strokeWidth="2.2" />
        <path className="eon-orb__current eon-orb__current--three" d="M34 150c17-38 35-15 49-53 13-35 31-50 65-65" fill="none" stroke="#d9c9ff" strokeOpacity=".65" strokeWidth="1.35" />
        <ellipse className="eon-orb__core" cx="92" cy="91" rx="25" ry="22" fill="#d9ccff" filter={`url(#${glow})`} />
        <circle className="eon-orb__spark s1" cx="55" cy="73" r="2.1" fill="#fff" />
        <circle className="eon-orb__spark s2" cx="126" cy="60" r="1.7" fill="#83eeff" />
        <circle className="eon-orb__spark s3" cx="130" cy="121" r="2.4" fill="#ffb15e" />
        <circle className="eon-orb__spark s4" cx="72" cy="131" r="1.5" fill="#dd91ff" />
      </g>
      <circle cx="90" cy="90" r="67.5" fill="none" stroke={`url(#${glass})`} strokeWidth="1.4" />
      <path className="eon-orb__specular" d="M45 66c13-25 34-38 58-40 14-1 28 2 39 8" fill="none" stroke="#fff" strokeLinecap="round" strokeOpacity=".48" strokeWidth="2.3" />
    </svg>
    <span className="eon-orb__ring" aria-hidden="true" />
  </div>;
}
