import { NextRequest, NextResponse } from "next/server";
import { inMemoryDb } from "@/lib/db";
import { AuthService } from "@/lib/auth";
import { AuditService } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const session = inMemoryDb.verificationSessions.get(id);

  if (!session) {
    return NextResponse.json({ error: "Verification session not found" }, { status: 404 });
  }

  // Find associated escrow
  let escrow = Array.from(inMemoryDb.escrows.values()).find((e) => e.id === session.escrowId);
  if (!escrow) {
    return NextResponse.json({ error: "Associated escrow not found" }, { status: 404 });
  }

  if (new Date(escrow.deadline).getTime() < Date.now()) {
    return NextResponse.json({ error: "Cannot retry: escrow deadline has expired" }, { status: 400 });
  }

  // Re-open escrow state to ACTIVE for a retry
  escrow.status = "ACTIVE";
  escrow.updatedAt = new Date().toISOString();
  inMemoryDb.escrows.set(escrow.publicId, escrow);

  const user = await AuthService.getCurrentUser();
  AuditService.logEvent({
    actorId: user.id,
    actorAccount: user.nearAccountId,
    escrowId: escrow.id,
    eventType: "VERIFICATION_RETRY_INITIATED",
    metadata: { previousSessionId: id, publicId: escrow.publicId },
  });

  return NextResponse.json({
    success: true,
    message: "Escrow re-opened for rescan. Proceed to camera capture.",
    publicId: escrow.publicId,
  });
}
