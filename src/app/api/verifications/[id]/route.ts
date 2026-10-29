import { NextRequest, NextResponse } from "next/server";
import { inMemoryDb } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const session = inMemoryDb.verificationSessions.get(id);

  if (!session) {
    return NextResponse.json({ error: "Verification session not found" }, { status: 404 });
  }

  return NextResponse.json({ verificationSession: session });
}
