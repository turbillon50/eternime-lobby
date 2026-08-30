import type { Metadata } from "next";
import { Boveda } from "@/components/app/Boveda";
export const metadata:Metadata={title:"Bóveda"};
export default function Page(){return <div className="grid gap-6"><header className="eon-page-head"><span className="eon-page-mark"/><div><p className="eon-page-kicker">Privado por diseño</p><h1>Bóveda</h1><p>Archivos, audios y documentos que quieres conservar bajo tu control.</p></div></header><Boveda/></div>}
