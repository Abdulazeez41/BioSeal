import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { inMemoryDb } from "@/lib/db";
import { AuthService } from "@/lib/auth";
import { AuditService } from "@/lib/audit";

const OperatorReviewSchema = z.object({
  decision: z.enum(["UPHOLD_VIOLATION", "OVERRIDE_CONDITION_MET", "ORDER_PHYSICAL_INSPECTION"]),
  writtenReason: z.string().min(15, "Written reason must be at least 15 characters explaining the physical evidence"),
  policyReference: z.string().min(3),
  explicitConfirmation: z.literal(true, {
    errorMap: () => ({ message: "Explicit confirmation checkbox is required" }),
  }),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { publicId: string } }
) {
  const { publicId } = params;
  const user = await AuthService.getCurrentUser();

  if (user.role !== "OPERATOR" && user.role !== "AUDITOR") {
    return NextResponse.json(
      { error: "Access denied. Operator or Auditor role required." },
      { status: 403 }
    );
  }

  const escrow = inMemoryDb.escrows.get(publicId);
  if (!escrow) {
    return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const data = OperatorReviewSchema.parse(body);

    if (data.decision === "OVERRIDE_CONDITION_MET") {
      escrow.status = "CONDITION_MET";
    } else if (data.decision === "UPHOLD_VIOLATION") {
      escrow.status = "CONDITION_VIOLATED";
    }

    escrow.updatedAt = new Date().toISOString();
    inMemoryDb.escrows.set(publicId, escrow);

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    AuditService.logEvent({
      actorId: user.id,
      actorAccount: user.nearAccountId,
      escrowId: escrow.id,
      eventType: "OPERATOR_MANUAL_REVIEW_DECISION",
      metadata: {
        publicId,
        decision: data.decision,
        writtenReason: data.writtenReason,
        reviewerRole: user.role,
        policyReference: data.policyReference,
        timestamp: new Date().toISOString(),
      },
      ip,
    });

    return NextResponse.json({
      success: true,
      decision: data.decision,
      escrow,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid review payload" }, { status: 400 });
  }
}
