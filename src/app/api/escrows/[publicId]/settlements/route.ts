import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { inMemoryDb } from "@/lib/db";
import { AuthService } from "@/lib/auth";
import { AuditService } from "@/lib/audit";
import { NearIntentsService } from "@/lib/near-intents";
import { SettlementModel } from "@/lib/types";

const SettlementRequestSchema = z.object({
  destinationChain: z.string().default("NEAR"),
  destinationAccount: z.string().min(2),
  quoteId: z.string().optional(),
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

  if (escrow.status !== "CONDITION_MET" && escrow.status !== "CONDITION_VIOLATED") {
    return NextResponse.json(
      { error: `Cannot settle escrow with status ${escrow.status}. Must be CONDITION_MET or CONDITION_VIOLATED.` },
      { status: 400 }
    );
  }

  try {
    const user = await AuthService.getCurrentUser();
    const body = await req.json();
    const data = SettlementRequestSchema.parse(body);

    // Request solver quotes
    const quoteResponse = await NearIntentsService.requestQuotes({
      sourceChain: "NEAR",
      sourceAsset: escrow.assetSymbol,
      sourceAmount: escrow.assetAmount,
      destinationChain: data.destinationChain,
      destinationAsset: escrow.assetSymbol,
      recipientAddress: data.destinationAccount,
      escrowPublicId: publicId,
    });

    const chosenQuote = quoteResponse.quotes.find((q) => q.quoteId === data.quoteId) || quoteResponse.bestQuote;

    const settlementId = `st_${crypto.randomUUID()}`;
    const newSettlement: SettlementModel = {
      id: settlementId,
      escrowId: escrow.id,
      verificationSessionId: escrow.verificationSessions?.[0]?.id || null,
      status: "QUOTED",
      destinationChain: data.destinationChain,
      destinationAccount: data.destinationAccount,
      assetSymbol: escrow.assetSymbol,
      assetAmount: escrow.assetAmount,
      intentReference: `intent_${crypto.randomBytes(6).toString("hex")}`,
      feeEstimate: `${chosenQuote.estimatedFeeUsd} USD`,
      solverId: chosenQuote.solverId,
      createdAt: new Date().toISOString(),
    };

    inMemoryDb.settlements.set(settlementId, newSettlement);
    if (!escrow.settlements) escrow.settlements = [];
    escrow.settlements.push(newSettlement);
    inMemoryDb.escrows.set(publicId, escrow);

    // Create intent payload for client wallet signature
    const intentPayload = NearIntentsService.createIntentPayload({
      quoteId: chosenQuote.quoteId,
      escrowPublicId: publicId,
      signerAccount: user.nearAccountId || escrow.senderAccount,
      destinationChain: data.destinationChain,
      destinationAccount: data.destinationAccount,
      assetAmount: escrow.assetAmount,
      assetSymbol: escrow.assetSymbol,
    });

    AuditService.logEvent({
      actorId: user.id,
      actorAccount: user.nearAccountId,
      escrowId: escrow.id,
      eventType: "SETTLEMENT_INTENT_CREATED",
      metadata: {
        publicId,
        settlementId,
        quoteId: chosenQuote.quoteId,
        destinationChain: data.destinationChain,
        destinationAccount: data.destinationAccount,
        fee: chosenQuote.estimatedFeeUsd,
      },
    });

    return NextResponse.json({
      success: true,
      settlement: newSettlement,
      quote: chosenQuote,
      allQuotes: quoteResponse.quotes,
      intentPayload,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create settlement quote" }, { status: 400 });
  }
}
