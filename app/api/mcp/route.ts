import { NextResponse } from "next/server";
import { authenticateMcpToken } from "@/lib/data/mcp-access";
import { handleMcpPost, mcpMetadata } from "@/lib/mcp/server";

export const runtime="nodejs";
export const maxDuration=60;

export async function POST(req:Request){
 const auth=req.headers.get("authorization")||""; const token=auth.startsWith("Bearer ")?auth.slice(7).trim():""; const access=await authenticateMcpToken(token); if(!access)return NextResponse.json({error:"Unauthorized"},{status:401,headers:{"WWW-Authenticate":"Bearer"}});
 return handleMcpPost(req,access);
}
export async function GET(){return mcpMetadata("/api/mcp","Bearer token generated inside Eternime")}
