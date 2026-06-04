import { NextResponse } from "next/server";
import { getLlmStatus } from "@/lib/eternime/llm";

export async function GET() {
  return NextResponse.json(getLlmStatus());
}
