import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { inMemoryDb } from "@/lib/db";
import { AuthService } from "@/lib/auth";
import { AuditService } from "@/lib/audit";
import { NearContractClient } from "@/lib/near";
import { IndicatorModel } from "@/lib/types";

const RegisterIndicatorSchema = z.object({
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
});

export async function POST(
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = RegisterIndicatorSchema.parse(body);

    const indicatorId = `ind_${crypto.randomUUID()}`;
    const bindingSeed = `${publicId}:${data.indicatorType}:${data.expectedState}:${data.batchReference || "BATCH-00"}`;
    const bindingHash = "0x" + crypto.createHash("sha256").update(bindingSeed).digest("hex");

    const indicator: IndicatorModel = {
      id: indicatorId,
      escrowId: escrow.id,
      indicatorType: data.indicatorType,
      manufacturer: data.manufacturer || null,
      batchReference: data.batchReference || null,
      expectedState: data.expectedState,
      failureState: data.failureState,
      bindingHash,
      registeredAt: new Date().toISOString(),
      bindingMethod: data.bindingMethod,
    };

    inMemoryDb.indicators.set(indicatorId, indicator);
    escrow.indicator = indicator;
    escrow.updatedAt = new Date().toISOString();
    inMemoryDb.escrows.set(publicId, escrow);

    // Register onchain
    await NearContractClient.registerIndicatorOnchain(
      publicId,
      bindingHash,
      user.nearAccountId || escrow.senderAccount
    );

    AuditService.logEvent({
      actorId: user.id,
      actorAccount: user.nearAccountId,
      escrowId: escrow.id,
      eventType: "INDICATOR_REGISTERED",
      metadata: { publicId, indicatorId, bindingHash, type: data.indicatorType },
    });

    return NextResponse.json({ success: true, indicator });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid indicator data" }, { status: 400 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { publicId: string } }
) {
  const { publicId } = params;
  const escrow = inMemoryDb.escrows.get(publicId);

  if (!escrow) {
    return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
  }

  const list = Array.from(inMemoryDb.indicators.values()).filter(
    (ind) => ind.escrowId === escrow.id
  );

  return NextResponse.json({ indicators: list });
}
