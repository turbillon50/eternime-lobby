import { NextResponse } from "next/server";
import { getOpenAIStatus } from "@/lib/eternime/openai";

export async function GET() {
  return NextResponse.json(getOpenAIStatus());
}
