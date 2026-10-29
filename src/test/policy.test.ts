import { describe, it, expect } from "vitest";
import { NearContractClient } from "@/lib/near";
import { NearIntentsService } from "@/lib/near-intents";

describe("Settlement Policy & Intent Execution", () => {
  it("should settle condition met escrow and route funds to recipient", async () => {
    const escrowId = "BIO-POLICY-MET";
    await NearContractClient.createEscrowOnchain({
      escrowId,
      senderAccount: "alice.testnet",
      recipientAccount: "bob_hospital.testnet",
      tokenAsset: "NEAR",
      tokenAmount: "1000",
      policyHash: "0xhash",
      indicatorType: "TEMPERATURE",
      indicatorBindingHash: "0xbind",
      deadlineMs: Date.now() + 86400000,
    });
    await NearContractClient.fundEscrowOnchain(escrowId, "alice.testnet");

    // Submit verified ConditionMet
    await NearContractClient.submitVerificationOnchain({
      escrowId,
      sessionId: "vs_met_01",
      imageHash: "0ximage",
      modelId: "bioseal-vision-tee",
      attestationRef: "quote_ref_01",
      resultCode: "CONDITION_MET",
      confidenceBps: 9940,
    });

    const resolution = await NearContractClient.resolveEscrowOnchain(escrowId, "alice.testnet");
    expect(resolution.record.status).toBe("SETTLED");
    expect(resolution.recipientPaid).toBe("bob_hospital.testnet");
  });

  it("should route condition violated escrow to claim recipient (insurer)", async () => {
    const escrowId = "BIO-POLICY-VIOLATED";
    await NearContractClient.createEscrowOnchain({
      escrowId,
      senderAccount: "alice.testnet",
      recipientAccount: "bob.testnet",
      claimRecipientAccount: "zurich_insurance.testnet",
      tokenAsset: "NEAR",
      tokenAmount: "2500",
      policyHash: "0xhash",
      indicatorType: "SHOCK",
      indicatorBindingHash: "0xbind",
      deadlineMs: Date.now() + 86400000,
    });
    await NearContractClient.fundEscrowOnchain(escrowId, "alice.testnet");

    // Submit verified ConditionViolated
    await NearContractClient.submitVerificationOnchain({
      escrowId,
      sessionId: "vs_viol_01",
      imageHash: "0ximage",
      modelId: "bioseal-vision-tee",
      attestationRef: "quote_ref_02",
      resultCode: "CONDITION_VIOLATED",
      confidenceBps: 9880,
    });

    const resolution = await NearContractClient.resolveEscrowOnchain(escrowId, "alice.testnet");
    expect(resolution.record.status).toBe("SETTLED");
    expect(resolution.recipientPaid).toBe("zurich_insurance.testnet");
  });

  it("should request competitive quotes from NEAR Intents solvers", async () => {
    const quoteResponse = await NearIntentsService.requestQuotes({
      sourceChain: "NEAR",
      sourceAsset: "USDC",
      sourceAmount: "50000",
      destinationChain: "Arbitrum",
      destinationAsset: "USDC",
      recipientAddress: "0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97",
    });

    expect(quoteResponse.quotes.length).toBeGreaterThanOrEqual(2);
    expect(quoteResponse.bestQuote.reputationScore).toBeGreaterThan(95);
    expect(quoteResponse.bestQuote.route).toContain("Arbitrum");
  });
});
