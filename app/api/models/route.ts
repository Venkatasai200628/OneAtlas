import { NextResponse } from "next/server";
import { MODEL_REGISTRY } from "@/lib/models";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: MODEL_REGISTRY,
  });
}
