import type { Metadata } from "next";
import { McpConnectionsClient } from "@/components/app/McpConnectionsClient";
export const metadata:Metadata={title:"Mis IAs · MCP"};
export default function IasPage(){return <div className="grid gap-6"><header className="eon-page-head"><span className="eon-page-mark"/><div><p className="eon-page-kicker">Memoria portátil</p><h1>Mis IAs</h1><p>Decide qué inteligencias pueden conocerte y hasta dónde.</p></div></header><McpConnectionsClient/></div>}
