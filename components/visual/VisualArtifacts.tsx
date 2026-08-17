import type { HTMLAttributes, PropsWithChildren } from "react";

type Props = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export function CrystalSurface({children,className="",...rest}:Props){return <div className={`va-crystal ${className}`} {...rest}>{children}</div>}
export function SpatialFrame({children,className="",...rest}:Props){return <div className={`va-spatial ${className}`} {...rest}>{children}</div>}
export function LivingMesh({className=""}:{className?:string}){return <div className={`va-mesh ${className}`} aria-hidden="true"><i/><i/><i/></div>}
export function PresenceHalo({className=""}:{className?:string}){return <div className={`va-halo ${className}`} aria-hidden="true"/>}
export function LightSweep({className=""}:{className?:string}){return <div className={`va-sweep ${className}`} aria-hidden="true"/>}
