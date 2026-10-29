import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { inMemoryDb } from "@/lib/db";
import { AuthService } from "@/lib/auth";
import { AuditService } from "@/lib/audit";
import { NearContractClient } from "@/lib/near";
import { checkRateLimit } from "@/lib/rate-limit";
import { EscrowModel, IndicatorModel } from "@/lib/types";

const CreateEscrowSchema = z.object({
  title: z.string().min(3).max(100),
  assetCategory: z.string().min(2).max(50),
  confidentialDescription: z.string().optional(),
  senderAccount: z.string().min(2),
  recipientAccount: z.string().min(2),
  claimRecipientAccount: z.string().optional(),
  deadline: z.string(),
  privacyLevel: z.enum(["STANDARD", "STRICT"]).default("STANDARD"),
  mediaRetentionDays: z.number().int().min(1).max(365).default(30),
  indicator: z.object({
    indicatorType: z.enum([
      "TEMPERATURE",
      "HUMIDITY",
      "TAMPER",
      "SHOCK",
      "UV",
      "BIOCHEMICAL",
      "CUSTOM",
    ]),
    expectedState: z.string().min(3),
    failureState: z.string().min(3),
    manufacturer: z.string().optional(),
    batchReference: z.string().optional(),
    bindingMethod: z.enum(["QR_CODE", "NFC_TAG", "MANUAL_ID"]).default("QR_CODE"),
  }),
  policy: z.object({
    assetSymbol: z.string().min(1),
    assetAmount: z.string().min(1),
    destinationChain: z.string().default("NEAR"),
    onConditionMet: z.object({
      action: z.enum(["RELEASE_TO_RECIPIENT", "SPLIT_PAYMENT", "HOLD"]),
      destinationChain: z.string().optional(),
    }),
    onConditionViolated: z.object({
      action: z.enum(["ROUTE_TO_CLAIM_RECIPIENT", "REFUND_TO_SENDER", "HOLD_FOR_MANUAL_REVIEW"]),
      claimAllocationPercentage: z.number().min(0).max(100).optional(),
      requiresManualReview: z.boolean().default(false),
    }),
    onInconclusive: z.object({
      action: z.enum(["ALLOW_RESCAN_UNTIL_DEADLINE", "HOLD_FOR_AUDIT"]),
      maxRescans: z.number().optional(),
    }),
    onExpiry: z.object({
      action: z.enum(["AUTO_REFUND_TO_SENDER", "ROUTE_TO_CLAIM_RECIPIENT"]),
    }),
    requiresManualReview: z.boolean().default(false),
  }),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const { allowed } = checkRateLimit(ip, 30, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Please wait a moment." }, { status: 429 });
  }

  try {
    const user = await AuthService.getCurrentUser();
    const body = await req.json();
    const data = CreateEscrowSchema.parse(body);

    // Generate unique short human-readable public ID (e.g., BIO-5821)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const publicId = `BIO-${randomSuffix}`;
    const escrowId = `esc_${crypto.randomUUID()}`;
    const indicatorId = `ind_${crypto.randomUUID()}`;

    // Compute cryptographic policy hash
    const policyJsonString = JSON.stringify(data.policy);
    const policyHash = "0x" + crypto.createHash("sha256").update(policyJsonString).digest("hex");

    // Compute cryptographic indicator binding hash
    const bindingSeed = `${publicId}:${data.indicator.indicatorType}:${data.indicator.expectedState}:${data.indicator.batchReference || "BATCH-00"}`;
    const bindingHash = "0x" + crypto.createHash("sha256").update(bindingSeed).digest("hex");

    const indicator: IndicatorModel = {
      id: indicatorId,
      escrowId,
      indicatorType: data.indicator.indicatorType,
      manufacturer: data.indicator.manufacturer || null,
      batchReference: data.indicator.batchReference || null,
      expectedState: data.indicator.expectedState,
      failureState: data.indicator.failureState,
      bindingHash,
      registeredAt: new Date().toISOString(),
      bindingMethod: data.indicator.bindingMethod,
    };

    const newEscrow: EscrowModel = {
      id: escrowId,
      publicId,
      creatorId: user.id,
      title: data.title,
      assetCategory: data.assetCategory,
      senderAccount: data.senderAccount,
      recipientAccount: data.recipientAccount,
      claimRecipientAccount: data.claimRecipientAccount || null,
      assetSymbol: data.policy.assetSymbol,
      assetAmount: data.policy.assetAmount,
      currency: data.policy.assetSymbol === "NEAR" ? "NEAR" : "USD",
      deadline: new Date(data.deadline).toISOString(),
      status: "AWAITING_FUNDING",
      policyHash,
      privacyLevel: data.privacyLevel,
      mediaRetentionDays: data.mediaRetentionDays,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      indicator,
      policy: data.policy,
      settlements: [],
      verificationSessions: [],
    };

    // Store in database
    inMemoryDb.indicators.set(indicatorId, indicator);
    inMemoryDb.escrows.set(publicId, newEscrow);

    // Record onchain creation in NEAR contract
    const deadlineMs = new Date(data.deadline).getTime();
    await NearContractClient.createEscrowOnchain({
      escrowId: publicId,
      senderAccount: data.senderAccount,
      recipientAccount: data.recipientAccount,
      claimRecipientAccount: data.claimRecipientAccount,
      tokenAsset: data.policy.assetSymbol,
      tokenAmount: data.policy.assetAmount,
      policyHash,
      indicatorType: data.indicator.indicatorType,
      indicatorBindingHash: bindingHash,
      deadlineMs,
    });

    AuditService.logEvent({
      actorId: user.id,
      actorAccount: user.nearAccountId,
      escrowId,
      eventType: "ESCROW_CREATED",
      metadata: {
        publicId,
        senderAccount: data.senderAccount,
        recipientAccount: data.recipientAccount,
        assetAmount: data.policy.assetAmount,
        assetSymbol: data.policy.assetSymbol,
        policyHash,
        indicatorType: data.indicator.indicatorType,
      },
      ip,
    });

    return NextResponse.json({
      success: true,
      escrow: newEscrow,
      bindingHash,
      qrVerificationUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify?escrowId=${publicId}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid escrow data" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const creatorOnly = searchParams.get("myEscrows") === "true";

  const user = await AuthService.getCurrentUser();
  let list = Array.from(inMemoryDb.escrows.values());

  if (creatorOnly) {
    list = list.filter((e) => e.creatorId === user.id || e.senderAccount === user.nearAccountId);
  }
  if (status) {
    list = list.filter((e) => e.status === status);
  }

  // Sort descending by createdAt
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({
    escrows: list,
    total: list.length,
  });
}
