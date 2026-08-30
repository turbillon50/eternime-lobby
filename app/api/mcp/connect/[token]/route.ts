import { NextResponse } from "next/server";
import { authenticateMcpToken } from "@/lib/data/mcp-access";
import { handleMcpPost, mcpMetadata } from "@/lib/mcp/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type Context = { params: Promise<{ token: string }> };

async function authorize(params: Context["params"]) {
  const { token } = await params;
  return authenticateMcpToken(token);
}

export async function POST(request: Request, { params }: Context) {
  const access = await authorize(params);
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  return handleMcpPost(request, access);
}

export async function GET(_request: Request, { params }: Context) {
  const access = await authorize(params);
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  return mcpMetadata("/api/mcp/connect/[secure-key]", "Embedded in the private connection URL");
}
