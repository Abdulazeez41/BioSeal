import { NextRequest, NextResponse } from "next/server";
import { inMemoryDb } from "@/lib/db";
import { AuthService } from "@/lib/auth";
import { AuditService } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: { publicId: string } }
) {
  const { publicId } = params;
  const escrow = inMemoryDb.escrows.get(publicId);

  if (!escrow) {
    return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
  }

  if (escrow.status !== "AWAITING_FUNDING" && escrow.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Only unfunded escrows can be cancelled before deadline" },
      { status: 400 }
    );
  }

  const user = await AuthService.getCurrentUser();
  if (escrow.creatorId !== user.id && user.role !== "OPERATOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  escrow.status = "CANCELLED";
  escrow.updatedAt = new Date().toISOString();
  inMemoryDb.escrows.set(publicId, escrow);

  AuditService.logEvent({
    actorId: user.id,
    actorAccount: user.nearAccountId,
    escrowId: escrow.id,
    eventType: "ESCROW_CANCELLED",
    metadata: { publicId },
  });

  return NextResponse.json({ success: true, escrow });
}
