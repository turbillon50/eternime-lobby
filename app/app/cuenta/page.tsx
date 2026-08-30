import type { Metadata } from "next";
import { AccountUsageClient } from "@/components/app/AccountUsageClient";
export const metadata:Metadata={title:"Cuenta y memoria"};
export default function Page(){return <div className="grid gap-6"><header className="eon-page-head"><span className="eon-page-mark"/><div><p className="eon-page-kicker">Tu infraestructura</p><h1>Cuenta y memoria</h1><p>Tu tenant privado, consumo y accesos de IA en un solo lugar.</p></div></header><AccountUsageClient/></div>}
