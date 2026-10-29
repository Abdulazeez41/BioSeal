import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { inMemoryDb } from "@/lib/db";
import { AuthService } from "@/lib/auth";
import { AuditService } from "@/lib/audit";
import { NearContractClient } from "@/lib/near";

const ApproveSettlementSchema = z.object({
  signatureHex: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const settlement = inMemoryDb.settlements.get(id);

  if (!settlement) {
    return NextResponse.json({ error: "Settlement not found" }, { status: 404 });
  }

  const escrow = Array.from(inMemoryDb.escrows.values()).find((e) => e.id === settlement.escrowId);
  if (!escrow) {
    return NextResponse.json({ error: "Associated escrow not found" }, { status: 404 });
  }

  const user = await AuthService.getCurrentUser();
  const caller = user.nearAccountId || escrow.senderAccount;

  // Resolve onchain on NEAR contract
  const onchain = await NearContractClient.resolveEscrowOnchain(escrow.publicId, caller);

  settlement.status = "SETTLED";
  settlement.transactionReference = onchain.tx.transactionHash;
  settlement.completedAt = new Date().toISOString();
  inMemoryDb.settlements.set(id, settlement);

  escrow.status = "SETTLED";
  escrow.updatedAt = new Date().toISOString();
  inMemoryDb.escrows.set(escrow.publicId, escrow);

  AuditService.logEvent({
    actorId: user.id,
    actorAccount: caller,
    escrowId: escrow.id,
    eventType: "SETTLEMENT_EXECUTED",
    metadata: {
      settlementId: id,
      publicId: escrow.publicId,
      destinationChain: settlement.destinationChain,
      destinationAccount: settlement.destinationAccount,
      txHash: onchain.tx.transactionHash,
    },
  });

  return NextResponse.json({
    success: true,
    settlement,
    tx: onchain.tx,
    recipientPaid: onchain.recipientPaid,
  });
}
