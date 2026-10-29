import { NextRequest, NextResponse } from "next/server";
import { inMemoryDb } from "@/lib/db";
import { NearContractClient } from "@/lib/near";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const session = inMemoryDb.verificationSessions.get(id);

  if (!session) {
    return NextResponse.json({ error: "Verification session not found" }, { status: 404 });
  }

  const escrow = Array.from(inMemoryDb.escrows.values()).find((e) => e.id === session.escrowId);
  const indicator = inMemoryDb.indicators.get(session.indicatorId);

  // Get onchain state from NEAR contract
  const onchain = escrow ? await NearContractClient.getEscrowOnchain(escrow.publicId) : null;

  const proof = {
    bioSealId: escrow?.publicId || "UNKNOWN",
    verificationSessionId: session.id,
    indicatorType: indicator?.indicatorType || "TEMPERATURE",
    indicatorBindingHash: indicator?.bindingHash || "0x00",
    classification: session.classification,
    confidence: session.confidence,
    timestamp: session.completedAt || session.createdAt,
    imageHash: session.imageHash,
    modelId: session.modelId,
    attestationReference: session.attestationReference,
    gatewayAttestation: {
      status: session.gatewayAttestationVerified ? "VERIFIED" : "UNVERIFIED",
      enclaveType: "INTEL_SGX_2",
      quotePcr0: "0x4a7e93b169524f0c72e2cf6f76c5b96791e2b6da08d8102462e7834a36f5e821",
      mrSigner: "0x4a7e93b169524f0c72e2cf6f76c5b96791e2b6da08d8102462e7834a36f5e821",
    },
    modelAttestation: {
      status: session.modelAttestationVerified ? "VERIFIED" : "UNVERIFIED",
      weightsSha256: "0xd8c21a4f0015ecf364119d854aa1974720938ff6a2444005b820fb741279ce5b",
    },
    responseSignature: {
      status: session.signatureVerified ? "VERIFIED" : "UNVERIFIED",
      reference: session.responseSignatureReference,
    },
    onchainReference: {
      contractId: NearContractClient.CONTRACT_ID,
      network: NearContractClient.NETWORK_ID,
      recordedStatus: onchain?.status || session.classification,
      attestationTxRef: onchain?.attestation_reference || session.attestationReference,
    },
    evidenceNotes: session.evidenceNotes || [],
    explanation: session.explanation,
  };

  return NextResponse.json({ proof });
}
