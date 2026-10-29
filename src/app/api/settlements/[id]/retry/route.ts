import { NextRequest, NextResponse } from "next/server";
import { inMemoryDb } from "@/lib/db";
import { AuthService } from "@/lib/auth";
import { AuditService } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const settlement = inMemoryDb.settlements.get(id);

  if (!settlement) {
    return NextResponse.json({ error: "Settlement not found" }, { status: 404 });
  }

  const user = await AuthService.getCurrentUser();
  settlement.status = "SUBMITTED";
  settlement.completedAt = null;
  inMemoryDb.settlements.set(id, settlement);

  AuditService.logEvent({
    actorId: user.id,
    actorAccount: user.nearAccountId,
    escrowId: settlement.escrowId,
    eventType: "SETTLEMENT_RETRY_INITIATED",
    metadata: { settlementId: id },
  });

  return NextResponse.json({ success: true, settlement });
}
