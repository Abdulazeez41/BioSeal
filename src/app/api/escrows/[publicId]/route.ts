import { NextRequest, NextResponse } from "next/server";
import { inMemoryDb } from "@/lib/db";
import { AuthService } from "@/lib/auth";
import { AuditService } from "@/lib/audit";
import { z } from "zod";

const PatchEscrowSchema = z.object({
  title: z.string().optional(),
  mediaRetentionDays: z.number().int().min(1).max(365).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { publicId: string } }
) {
  const { publicId } = params;
  const escrow = inMemoryDb.escrows.get(publicId);

  if (!escrow) {
    return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
  }

  // Populate indicator if not already joined
  if (!escrow.indicator) {
    for (const ind of Array.from(inMemoryDb.indicators.values())) {
      if (ind.escrowId === escrow.id) {
        escrow.indicator = ind;
        break;
      }
    }
  }

  // Populate verification sessions
  const sessions = Array.from(inMemoryDb.verificationSessions.values()).filter(
    (s) => s.escrowId === escrow.id
  );
  escrow.verificationSessions = sessions;

  // Populate settlements
  const settlements = Array.from(inMemoryDb.settlements.values()).filter(
    (s) => s.escrowId === escrow.id
  );
  escrow.settlements = settlements;

  return NextResponse.json({ escrow });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { publicId: string } }
) {
  const { publicId } = params;
  const escrow = inMemoryDb.escrows.get(publicId);

  if (!escrow) {
    return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
  }

  const user = await AuthService.getCurrentUser();
  if (escrow.creatorId !== user.id && user.role !== "OPERATOR") {
    return NextResponse.json({ error: "Unauthorized to modify this escrow" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = PatchEscrowSchema.parse(body);

    if (data.title) escrow.title = data.title;
    if (data.mediaRetentionDays) escrow.mediaRetentionDays = data.mediaRetentionDays;
    escrow.updatedAt = new Date().toISOString();

    inMemoryDb.escrows.set(publicId, escrow);

    AuditService.logEvent({
      actorId: user.id,
      actorAccount: user.nearAccountId,
      escrowId: escrow.id,
      eventType: "ESCROW_UPDATED",
      metadata: { publicId, ...data },
    });

    return NextResponse.json({ success: true, escrow });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid update payload" }, { status: 400 });
  }
}
