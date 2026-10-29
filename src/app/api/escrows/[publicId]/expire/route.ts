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

  const now = Date.now();
  const deadlineTime = new Date(escrow.deadline).getTime();
  if (deadlineTime > now) {
    return NextResponse.json({ error: "Deadline has not yet passed" }, { status: 400 });
  }

  escrow.status = "EXPIRED";
  escrow.updatedAt = new Date().toISOString();
  inMemoryDb.escrows.set(publicId, escrow);

  const user = await AuthService.getCurrentUser();
  AuditService.logEvent({
    actorId: user.id,
    actorAccount: user.nearAccountId,
    escrowId: escrow.id,
    eventType: "ESCROW_EXPIRED",
    metadata: { publicId, deadline: escrow.deadline },
  });

  return NextResponse.json({ success: true, escrow });
}
