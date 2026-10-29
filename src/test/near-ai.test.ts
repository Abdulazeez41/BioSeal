import { describe, it, expect } from "vitest";
import { NearAiInferenceService } from "@/lib/near-ai";

describe("NEAR AI TEE Confidential Inference", () => {
  it("should verify TEE gateway attestation before inference", async () => {
    const gateway = await NearAiInferenceService.verifyGatewayAttestation("https://tee.near.ai/verify");
    expect(gateway.verified).toBe(true);
    expect(gateway.teeType).toBe("INTEL_SGX");
    expect(gateway.quotePcr0.startsWith("0x")).toBe(true);
  });

  it("should classify indicator within TEE and return hardware quote", async () => {
    const res = await NearAiInferenceService.classifyIndicator({
      sessionId: "vs_test_session_01",
      indicatorType: "TEMPERATURE",
      expectedState: "Reaction window uniform baseline white (+2°C to +8°C maintained)",
      failureState: "Magenta-purple activation dye release (> +8°C breached)",
      imageCiphertextBase64: "aW1hZ2VfdGVzdF9kYXRh",
      imageHash: "0x3a92847a0192834b",
      privacyLevel: "STRICT",
    });

    expect(res.sessionId).toBe("vs_test_session_01");
    expect(["CONDITION_MET", "CONDITION_VIOLATED", "INCONCLUSIVE"]).toContain(res.classification);
    expect(res.confidence).toBeGreaterThan(0.4);
    expect(res.gatewayAttestation.status).toBe("VERIFIED");
    expect(res.modelAttestation.status).toBe("VERIFIED");
    expect(res.responseSignature.status).toBe("VERIFIED");
    expect(res.attestationReference).toContain("near-ai-tee://quote/");

    // Cryptographic proof check
    const proofCheck = NearAiInferenceService.verifyAttestationProof(res);
    expect(proofCheck.valid).toBe(true);
    expect(proofCheck.gatewayVerified).toBe(true);
    expect(proofCheck.modelVerified).toBe(true);
    expect(proofCheck.signatureVerified).toBe(true);
  });

  it("should reject corrupted or forged attestation signatures", () => {
    const fakeRes: any = {
      sessionId: "vs_forged",
      classification: "CONDITION_MET",
      confidence: 0.99,
      gatewayAttestation: {
        status: "VERIFIED",
        enclaveMrSigner: "0x4a7e93b169524f0c72e2cf6f76c5b96791e2b6da08d8102462e7834a36f5e821",
        quotePcr0: "0x123",
        teeType: "INTEL_SGX",
      },
      modelAttestation: {
        status: "VERIFIED",
        modelWeightsSha256: "0xFORGED_WEIGHTS_HASH",
      },
      responseSignature: {
        status: "VERIFIED",
        signatureHex: "0xinvalid_signature",
        signerPublicKey: "0xwrong_key",
      },
    };

    const check = NearAiInferenceService.verifyAttestationProof(fakeRes);
    expect(check.valid).toBe(false);
    expect(check.modelVerified).toBe(false);
  });
});
