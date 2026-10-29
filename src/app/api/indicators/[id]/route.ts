import { NextRequest, NextResponse } from "next/server";
import { inMemoryDb } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const indicator = inMemoryDb.indicators.get(id);

  if (!indicator) {
    return NextResponse.json({ error: "Indicator not found" }, { status: 404 });
  }

  return NextResponse.json({ indicator });
}
