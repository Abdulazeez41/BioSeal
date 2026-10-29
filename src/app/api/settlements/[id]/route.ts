import { NextRequest, NextResponse } from "next/server";
import { inMemoryDb } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const settlement = inMemoryDb.settlements.get(id);

  if (!settlement) {
    return NextResponse.json({ error: "Settlement not found" }, { status: 404 });
  }

  return NextResponse.json({ settlement });
}
