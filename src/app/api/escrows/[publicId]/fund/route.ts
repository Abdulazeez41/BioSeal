import { NextRequest, NextResponse } from "next/server";
import { inMemoryDb } from "@/lib/db";
import { AuthService } from "@/lib/auth";
import { AuditService } from "@/lib/audit";
import { NearContractClient } from "@/lib/near";

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
      { error: `Cannot fund escrow in status ${escrow.status}` },
      { status: 400 }
    );
  }

  const user = await AuthService.getCurrentUser();
  const caller = user.nearAccountId || escrow.senderAccount;

  // Execute onchain contract call
  const onchain = await NearContractClient.fundEscrowOnchain(publicId, caller);

  escrow.status = "ACTIVE";
  escrow.updatedAt = new Date().toISOString();
  inMemoryDb.escrows.set(publicId, escrow);

  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  AuditService.logEvent({
    actorId: user.id,
    actorAccount: caller,
    escrowId: escrow.id,
    eventType: "ESCROW_FUNDED",
    metadata: {
      publicId,
      amount: escrow.assetAmount,
      symbol: escrow.assetSymbol,
      onchainTxHash: onchain.tx.transactionHash,
    },
    ip,
  });

  return NextResponse.json({
    success: true,
    escrow,
    tx: onchain.tx,
  });
}
