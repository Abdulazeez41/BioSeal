import { describe, it, expect, beforeEach } from "vitest";
import { inMemoryDb } from "@/lib/db";
import { NearContractClient } from "@/lib/near";
import crypto from "crypto";

describe("Escrow Creation & Lifecycle", () => {
  beforeEach(() => {
    inMemoryDb.seedDemonstrationData();
  });

  it("should have seeded demonstration escrows available", () => {
    expect(inMemoryDb.escrows.size).toBeGreaterThanOrEqual(4);
    const vacEscrow = inMemoryDb.escrows.get("BIO-9402");
    expect(vacEscrow).toBeDefined();
    expect(vacEscrow?.status).toBe("ACTIVE");
    expect(vacEscrow?.indicator?.indicatorType).toBe("TEMPERATURE");
  });

  it("should create escrow with deterministic policy and binding hashes", async () => {
    const publicId = `BIO-${Math.floor(1000 + Math.random() * 9000)}`;
    const policyString = JSON.stringify({ action: "RELEASE_TO_RECIPIENT", chain: "Arbitrum" });
    const policyHash = "0x" + crypto.createHash("sha256").update(policyString).digest("hex");
    const bindingHash = "0x" + crypto.createHash("sha256").update(`${publicId}:TAMPER:baseline`).digest("hex");

    const { record, tx } = await NearContractClient.createEscrowOnchain({
      escrowId: publicId,
      senderAccount: "sender.testnet",
      recipientAccount: "recipient.testnet",
      claimRecipientAccount: "claim.testnet",
      tokenAsset: "USDC",
      tokenAmount: "10000.00",
      policyHash,
      indicatorType: "TAMPER",
      indicatorBindingHash: bindingHash,
      deadlineMs: Date.now() + 86400000,
    });

    expect(record.escrow_id).toBe(publicId);
    expect(record.status).toBe("AWAITING_FUNDING");
    expect(tx.status).toBe("SUCCESS");
    expect(tx.transactionHash).toBeDefined();

    // Verify onchain retrieval
    const fetched = await NearContractClient.getEscrowOnchain(publicId);
    expect(fetched?.policy_hash).toBe(policyHash);
    expect(fetched?.indicator_binding_hash).toBe(bindingHash);
  });

  it("should fund escrow and update state to ACTIVE", async () => {
    const publicId = "BIO-TEST-FUND";
    await NearContractClient.createEscrowOnchain({
      escrowId: publicId,
      senderAccount: "alice.testnet",
      recipientAccount: "bob.testnet",
      tokenAsset: "NEAR",
      tokenAmount: "500",
      policyHash: "0x123",
      indicatorType: "TEMPERATURE",
      indicatorBindingHash: "0x456",
      deadlineMs: Date.now() + 86400000,
    });

    const funded = await NearContractClient.fundEscrowOnchain(publicId, "alice.testnet");
    expect(funded.record.status).toBe("ACTIVE");

    const events = await NearContractClient.getEscrowEventsOnchain(publicId);
    expect(events.some((e) => e.event_type === "ESCROW_FUNDED")).toBe(true);
  });
});
