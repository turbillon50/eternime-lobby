import { useId } from "react";

/** Decorative mobile presence. State comes from the conversation, never a timer. */
export function EonWave({ state = "idle" }: { state?: string }) {
  const id = useId().replace(/:/g, "");
  const paths = [
    "M8 76 C65 74 78 19 137 31 S212 124 274 80 S330 41 412 66",
    "M8 80 C66 80 83 117 144 83 S216 22 274 49 S344 110 412 69",
    "M8 79 C71 61 94 62 151 79 S212 99 276 72 S344 50 412 66",
  ];
  return <div className="eon-mobile-wave" data-state={state} aria-hidden="true">
    <svg viewBox="0 0 420 148" fill="none" focusable="false">
      <defs><linearGradient id={`${id}-ribbon`}><stop stopColor="#91e5ff" stopOpacity="0"/><stop offset=".23" stopColor="#a6beff"/><stop offset=".49" stopColor="#bca0ff"/><stop offset=".73" stopColor="#8fe7ff"/><stop offset="1" stopColor="#91e5ff" stopOpacity="0"/></linearGradient>
        <filter id={`${id}-light`} x="-20%" y="-90%" width="140%" height="280%"><feGaussianBlur stdDeviation="6"/></filter></defs>
      {paths.map((d, i) => <g key={d} className={`eon-mobile-wave__ribbon eon-mobile-wave__ribbon--${i}`}>
        <path d={d} stroke={`url(#${id}-ribbon)`} strokeWidth="7" opacity=".3" filter={`url(#${id}-light)`}/>
        {Array.from({ length: 12 }, (_, strand) => <path key={strand} d={d} transform={`translate(0 ${(strand - 5) * 1.15})`} stroke={`url(#${id}-ribbon)`} strokeWidth={strand === 5 ? 1.5 : .65} opacity={strand === 5 ? .95 : .15 + (5 - Math.abs(strand - 5)) * .055}/>)}
      </g>)}
    </svg>
  </div>;
}
