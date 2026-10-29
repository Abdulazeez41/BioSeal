import { NextRequest, NextResponse } from "next/server";
import { inMemoryDb } from "@/lib/db";
import { AuditService } from "@/lib/audit";
import { NearContractClient } from "@/lib/near";

export async function GET(
  req: NextRequest,
  { params }: { params: { publicId: string } }
) {
  const { publicId } = params;
  const escrow = inMemoryDb.escrows.get(publicId);

  if (!escrow) {
    return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
  }

  // Audit events from internal log
  const auditList = AuditService.getEvents({ escrowId: escrow.id });

  // Onchain events from NEAR contract
  const onchainEvents = await NearContractClient.getEscrowEventsOnchain(publicId);

  return NextResponse.json({
    publicId,
    auditEvents: auditList,
    onchainEvents,
  });
}
