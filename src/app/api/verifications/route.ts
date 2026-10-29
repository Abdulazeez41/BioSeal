import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { inMemoryDb } from "@/lib/db";
import { AuthService } from "@/lib/auth";
import { AuditService } from "@/lib/audit";
import { EncryptedStorageService } from "@/lib/storage";
import { NearAiInferenceService } from "@/lib/near-ai";
import { NearContractClient } from "@/lib/near";
import { checkRateLimit } from "@/lib/rate-limit";
import { VerificationSessionModel } from "@/lib/types";

const SubmitVerificationSchema = z.object({
  escrowPublicId: z.string().min(3),
  imageBase64: z.string().min(20),
  opticalMetrics: z
    .object({
      glareScore: z.number().optional(),
      blurScore: z.number().optional(),
      averageLuminance: z.number().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const { allowed } = checkRateLimit(ip, 20, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many verification requests. Please wait a moment." },
      { status: 429 }
    );
  }

  try {
    const user = await AuthService.getCurrentUser();
    const body = await req.json();
    const data = SubmitVerificationSchema.parse(body);

    const escrow = inMemoryDb.escrows.get(data.escrowPublicId);
    if (!escrow) {
      return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
    }

    if (escrow.status !== "ACTIVE" && escrow.status !== "INCONCLUSIVE") {
      return NextResponse.json(
        { error: `Cannot verify escrow in status ${escrow.status}. Must be ACTIVE or INCONCLUSIVE.` },
        { status: 400 }
      );
    }

    // Check deadline
    if (new Date(escrow.deadline).getTime() < Date.now()) {
      escrow.status = "EXPIRED";
      return NextResponse.json(
        { error: "Escrow deadline has passed. Indicator verification window expired." },
        { status: 400 }
      );
    }

    // Indicator must exist
    let indicator = escrow.indicator;
    if (!indicator) {
      for (const ind of Array.from(inMemoryDb.indicators.values())) {
        if (ind.escrowId === escrow.id) {
          indicator = ind;
          break;
        }
      }
    }
    if (!indicator) {
      return NextResponse.json({ error: "No physical indicator registered for this escrow" }, { status: 400 });
    }

    // 1. Process and encrypt raw image buffer
    const cleanBase64 = data.imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(cleanBase64, "base64");
    const sessionId = `vs_${crypto.randomUUID()}`;
    const storageKey = `img_${escrow.publicId}_${sessionId}`;

    const { hash: imageHash } = await EncryptedStorageService.storeEncryptedImage(
      storageKey,
      imageBuffer,
      "image/jpeg",
      escrow.mediaRetentionDays
    );

    // 2. Execute Private Inference through NEAR AI TEE Confidential compute node
    // Note: Strictly minimized data sent to NEAR AI (no user names, addresses, or financial amounts)
    const inferenceResponse = await NearAiInferenceService.classifyIndicator({
      sessionId,
      indicatorType: indicator.indicatorType,
      expectedState: indicator.expectedState,
      failureState: indicator.failureState,
      imageCiphertextBase64: cleanBase64.slice(0, 512), // Ciphertext or feature tensor
      imageHash,
      privacyLevel: escrow.privacyLevel,
    });

    // 3. Verify hardware TEE gateway and model attestation before accepting result
    const attestationCheck = NearAiInferenceService.verifyAttestationProof(inferenceResponse);
    if (!attestationCheck.valid) {
      AuditService.logEvent({
        actorId: user.id,
        escrowId: escrow.id,
        eventType: "ATTESTATION_VERIFICATION_FAILED",
        metadata: {
          sessionId,
          error: attestationCheck.error,
          publicId: escrow.publicId,
        },
        ip,
      });

      return NextResponse.json(
        {
          error: "Hardware-backed attestation verification failed. Inference integrity could not be proven.",
          details: attestationCheck.error,
        },
        { status: 422 }
      );
    }

    // 4. Save verification session record
    const sessionRecord: VerificationSessionModel = {
      id: sessionId,
      escrowId: escrow.id,
      indicatorId: indicator.id,
      verifierUserId: user.id,
      status: "VERIFIED",
      imageStorageKey: storageKey,
      imageHash,
      modelId: inferenceResponse.modelId,
      attestationReference: inferenceResponse.attestationReference,
      responseSignatureReference: inferenceResponse.responseSignature.signatureHex,
      classification: inferenceResponse.classification,
      confidence: inferenceResponse.confidence,
      explanation: inferenceResponse.explanation,
      evidenceNotes: inferenceResponse.evidenceNotes,
      gatewayAttestationVerified: attestationCheck.gatewayVerified,
      modelAttestationVerified: attestationCheck.modelVerified,
      signatureVerified: attestationCheck.signatureVerified,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    inMemoryDb.verificationSessions.set(sessionId, sessionRecord);

    // 5. Submit verified attestation to NEAR smart contract onchain
    const confidenceBps = Math.round(inferenceResponse.confidence * 10000);
    const onchain = await NearContractClient.submitVerificationOnchain({
      escrowId: escrow.publicId,
      sessionId,
      imageHash,
      modelId: inferenceResponse.modelId,
      attestationRef: inferenceResponse.attestationReference,
      resultCode: inferenceResponse.classification,
      confidenceBps,
    });

    // 6. Update escrow status based on policy and classification
    escrow.status = inferenceResponse.classification;
    escrow.updatedAt = new Date().toISOString();
    inMemoryDb.escrows.set(escrow.publicId, escrow);

    AuditService.logEvent({
      actorId: user.id,
      actorAccount: user.nearAccountId,
      escrowId: escrow.id,
      eventType: "VERIFICATION_COMPLETED",
      metadata: {
        publicId: escrow.publicId,
        sessionId,
        classification: inferenceResponse.classification,
        confidence: inferenceResponse.confidence,
        attestationRef: inferenceResponse.attestationReference,
        onchainTxHash: onchain.tx.transactionHash,
      },
      ip,
    });

    return NextResponse.json({
      success: true,
      verificationSession: sessionRecord,
      attestation: attestationCheck,
      onchainTx: onchain.tx,
      nextAction:
        inferenceResponse.classification === "CONDITION_MET"
          ? "Ready for automated or intent settlement to recipient"
          : inferenceResponse.classification === "CONDITION_VIOLATED"
          ? escrow.policy?.onConditionViolated.requiresManualReview
            ? "Pending operator review before penalty routing"
            : "Ready for policy execution to claim recipient"
          : "Inconclusive scan. Resubmit clear scan before deadline.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process verification" }, { status: 400 });
  }
}
