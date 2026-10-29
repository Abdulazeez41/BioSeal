import { PrismaClient } from "@prisma/client";
import {
  EscrowModel,
  IndicatorModel,
  SettlementModel,
  VerificationSessionModel,
  UserSession,
  AuditEventModel,
} from "../types";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

// In-Memory Fallback & Transactional Store
// Keeps demonstrator and test data synchronized in memory
class InMemoryDatabase {
  public users: Map<string, UserSession> = new Map();
  public escrows: Map<string, EscrowModel> = new Map();
  public indicators: Map<string, IndicatorModel> = new Map();
  public verificationSessions: Map<string, VerificationSessionModel> = new Map();
  public settlements: Map<string, SettlementModel> = new Map();
  public auditEvents: AuditEventModel[] = [];

  constructor() {
    this.seedDemonstrationData();
  }

  public seedDemonstrationData() {
    // 1. Users
    const alice: UserSession = {
      id: "usr_alice_101",
      nearAccountId: "alice_biopharma.testnet",
      externalWalletAddress: "0x71C...a84f",
      displayName: "Alice Vance (Novartis Cold-Chain)",
      role: "USER",
      createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    };
    const marcus: UserSession = {
      id: "usr_marcus_202",
      nearAccountId: "operator_marcus.near",
      externalWalletAddress: "0x38F...19bc",
      displayName: "Marcus Brody (BioSeal Operator)",
      role: "OPERATOR",
      createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    };
    const veritas: UserSession = {
      id: "usr_veritas_303",
      nearAccountId: "auditor_veritas.near",
      externalWalletAddress: "0x992...c011",
      displayName: "Veritas Protocol Auditor",
      role: "AUDITOR",
      createdAt: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
    };

    this.users.set(alice.id, alice);
    this.users.set(marcus.id, marcus);
    this.users.set(veritas.id, veritas);

    // 2. Demonstration Escrows
    // Escrow 1: Vaccine Consignment (ACTIVE)
    const e1Id = "esc_01_vac";
    const e1PublicId = "BIO-9402";
    const ind1Id = "ind_01_vac";
    this.indicators.set(ind1Id, {
      id: ind1Id,
      escrowId: e1Id,
      indicatorType: "TEMPERATURE",
      manufacturer: "Thermax CryoSystems",
      batchReference: "TX-2026-C44",
      expectedState: "Reaction window uniform baseline white (+2°C to +8°C maintained)",
      failureState: "Magenta-purple activation dye release (exceeded +8°C for > 30 minutes)",
      bindingHash: "0x98f4c219a164b008d72e81190bc128362d8e4f1a2609c5d1e0293bf6a0584b11",
      registeredAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      bindingMethod: "QR_CODE",
    });

    this.escrows.set(e1PublicId, {
      id: e1Id,
      publicId: e1PublicId,
      creatorId: alice.id,
      title: "mRNA Vaccine Consignment Lot #4029",
      assetCategory: "Pharmaceuticals",
      senderAccount: "alice_biopharma.testnet",
      recipientAccount: "geneva_central_hospital.testnet",
      claimRecipientAccount: "zurich_cargo_insurance.testnet",
      assetSymbol: "USDC",
      assetAmount: "50000.00",
      currency: "USD",
      deadline: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
      status: "ACTIVE",
      policyHash: "0x4b7c19f0910e28a556d7821098acbf01235619ca24e650110bfedc928490a1bc",
      privacyLevel: "STRICT",
      mediaRetentionDays: 30,
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      indicator: this.indicators.get(ind1Id),
      policy: {
        onConditionMet: { action: "RELEASE_TO_RECIPIENT", destinationChain: "Arbitrum" },
        onConditionViolated: { action: "ROUTE_TO_CLAIM_RECIPIENT", claimAllocationPercentage: 100, requiresManualReview: false },
        onInconclusive: { action: "ALLOW_RESCAN_UNTIL_DEADLINE", maxRescans: 3 },
        onExpiry: { action: "AUTO_REFUND_TO_SENDER" },
        requiresManualReview: false,
      },
    });

    // Escrow 2: Swiss Chronometer (CONDITION_MET & SETTLED)
    const e2Id = "esc_02_watch";
    const e2PublicId = "BIO-8147";
    const ind2Id = "ind_02_watch";
    const vs2Id = "vs_02_watch";
    const st2Id = "st_02_watch";

    this.indicators.set(ind2Id, {
      id: ind2Id,
      escrowId: e2Id,
      indicatorType: "TAMPER",
      manufacturer: "SecurPrint Switzerland",
      batchReference: "SP-VOID-882",
      expectedState: "Continuous nano-holographic matrix intact with unpeeled tamper adhesive",
      failureState: "Optical VOID/OPENED text release or torn shear line",
      bindingHash: "0x12a8f33190cbde6152a488c91100f5127e4bca9921b019348ecf118942a00918",
      registeredAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
      bindingMethod: "NFC_TAG",
    });

    this.verificationSessions.set(vs2Id, {
      id: vs2Id,
      escrowId: e2Id,
      indicatorId: ind2Id,
      verifierUserId: alice.id,
      status: "VERIFIED",
      imageStorageKey: `img_${e2PublicId}_verified`,
      imageHash: "0x550a12e84c9b917d23f40954930128e47265a04bc6198f321094ba45210984de",
      modelId: "bioseal-indicator-vision-v2-tee",
      attestationReference: "near-ai-tee://quote/vs_02_watch/0x88f2190bc",
      responseSignatureReference: "0x04e1b854...signed_by_tee",
      classification: "CONDITION_MET",
      confidence: 0.994,
      explanation: "Tamper hologram intact with zero shear displacement. Physical seal uncompromised.",
      evidenceNotes: [
        "Holographic lattice structure 99.8% geometric congruence.",
        "Zero adhesive shear displacement observed.",
      ],
      gatewayAttestationVerified: true,
      modelAttestationVerified: true,
      signatureVerified: true,
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    });

    this.settlements.set(st2Id, {
      id: st2Id,
      escrowId: e2Id,
      verificationSessionId: vs2Id,
      status: "SETTLED",
      destinationChain: "Ethereum",
      destinationAccount: "0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97",
      assetSymbol: "USDC",
      assetAmount: "32000.00",
      intentReference: "intent_0x99281bc4f1a20",
      transactionReference: "0x78a421b009e8f1929348f921004a8b291823746a91082348a7b982134098231a",
      feeEstimate: "2.10 USD",
      solverId: "solver-alpha.market-maker.near",
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    });

    this.escrows.set(e2PublicId, {
      id: e2Id,
      publicId: e2PublicId,
      creatorId: alice.id,
      title: "Audemars Piguet Royal Oak Chronograph",
      assetCategory: "Luxury Assets",
      senderAccount: "alice_biopharma.testnet",
      recipientAccount: "collector_tokyo.testnet",
      claimRecipientAccount: "lloyds_marine_underwriters.testnet",
      assetSymbol: "USDC",
      assetAmount: "32000.00",
      currency: "USD",
      deadline: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      status: "SETTLED",
      policyHash: "0x98124b1029e8471b0293847a01982bca98102384a7192834b901293847a01294",
      privacyLevel: "STANDARD",
      mediaRetentionDays: 60,
      createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      indicator: this.indicators.get(ind2Id),
      verificationSessions: [this.verificationSessions.get(vs2Id)!],
      settlements: [this.settlements.get(st2Id)!],
      policy: {
        onConditionMet: { action: "RELEASE_TO_RECIPIENT", destinationChain: "Ethereum" },
        onConditionViolated: { action: "ROUTE_TO_CLAIM_RECIPIENT", requiresManualReview: true },
        onInconclusive: { action: "ALLOW_RESCAN_UNTIL_DEADLINE" },
        onExpiry: { action: "AUTO_REFUND_TO_SENDER" },
        requiresManualReview: false,
      },
    });

    // Escrow 3: Semiconductor Wafer Consignment (CONDITION_VIOLATED)
    const e3Id = "esc_03_semi";
    const e3PublicId = "BIO-3051";
    const ind3Id = "ind_03_semi";
    const vs3Id = "vs_03_semi";

    this.indicators.set(ind3Id, {
      id: ind3Id,
      escrowId: e3Id,
      indicatorType: "SHOCK",
      manufacturer: "DropWatch Impact Sensors",
      batchReference: "DW-50G-CAL",
      expectedState: "Clear transparent sensor tube with mass in armed position (<50G impact)",
      failureState: "Red particulate dye release filling tube cavity (>50G impact sustained)",
      bindingHash: "0x6192847a0192834b91823746a91082348a7b982134098231a098234710293847",
      registeredAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      bindingMethod: "QR_CODE",
    });

    this.verificationSessions.set(vs3Id, {
      id: vs3Id,
      escrowId: e3Id,
      indicatorId: ind3Id,
      verifierUserId: alice.id,
      status: "VERIFIED",
      imageStorageKey: `img_${e3PublicId}_violated`,
      imageHash: "0x8921834710293847a91823746a91082348a7b982134098231a4b7c19f0910e28",
      modelId: "bioseal-indicator-vision-v2-tee",
      attestationReference: "near-ai-tee://quote/vs_03_semi/0x44c10829a",
      responseSignatureReference: "0x04e1b854...signed_by_tee",
      classification: "CONDITION_VIOLATED",
      confidence: 0.988,
      explanation: "Mechanical shock >50G confirmed. Shock tube capillary cavity 100% dye-saturated.",
      evidenceNotes: [
        "Capillary dye saturation ratio: 100%.",
        "Bi-directional acceleration trigger fired during transit.",
      ],
      gatewayAttestationVerified: true,
      modelAttestationVerified: true,
      signatureVerified: true,
      createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    });

    this.escrows.set(e3PublicId, {
      id: e3Id,
      publicId: e3PublicId,
      creatorId: alice.id,
      title: "300mm Silicon Photonic Wafers (Batch 71)",
      assetCategory: "Industrial Components",
      senderAccount: "alice_biopharma.testnet",
      recipientAccount: "tsmc_fab_arizona.testnet",
      claimRecipientAccount: "zurich_cargo_insurance.testnet",
      assetSymbol: "USDC",
      assetAmount: "120000.00",
      currency: "USD",
      deadline: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
      status: "CONDITION_VIOLATED",
      policyHash: "0x2834710293847a91823746a91082348a7b982134098231a4b7c19f0910e28a5",
      privacyLevel: "STRICT",
      mediaRetentionDays: 90,
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      indicator: this.indicators.get(ind3Id),
      verificationSessions: [this.verificationSessions.get(vs3Id)!],
      policy: {
        onConditionMet: { action: "RELEASE_TO_RECIPIENT", destinationChain: "Base" },
        onConditionViolated: { action: "ROUTE_TO_CLAIM_RECIPIENT", claimAllocationPercentage: 100, requiresManualReview: true },
        onInconclusive: { action: "ALLOW_RESCAN_UNTIL_DEADLINE" },
        onExpiry: { action: "AUTO_REFUND_TO_SENDER" },
        requiresManualReview: true,
      },
    });

    // Escrow 4: Laboratory Sample (AWAITING_FUNDING)
    const e4Id = "esc_04_lab";
    const e4PublicId = "BIO-6284";
    const ind4Id = "ind_04_lab";

    this.indicators.set(ind4Id, {
      id: ind4Id,
      escrowId: e4Id,
      indicatorType: "BIOCHEMICAL",
      manufacturer: "BioRad Diagnostic Systems",
      batchReference: "BR-LFA-2026",
      expectedState: "Single control band (C-line) visible, test band (T-line) negative",
      failureState: "Visible double band (both C-line and T-line activated)",
      bindingHash: "0x77192834710293847a91823746a91082348a7b982134098231a4b7c19f0910e2",
      registeredAt: new Date().toISOString(),
      bindingMethod: "MANUAL_ID",
    });

    this.escrows.set(e4PublicId, {
      id: e4Id,
      publicId: e4PublicId,
      creatorId: alice.id,
      title: "Stem Cell Culture Viability Escrow",
      assetCategory: "Laboratory Samples",
      senderAccount: "alice_biopharma.testnet",
      recipientAccount: "karolinska_institute.testnet",
      claimRecipientAccount: "alice_biopharma.testnet",
      assetSymbol: "NEAR",
      assetAmount: "3500.00",
      currency: "NEAR",
      deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      status: "AWAITING_FUNDING",
      policyHash: "0x8829102384a7192834b901293847a012942834710293847a91823746a9108234",
      privacyLevel: "STRICT",
      mediaRetentionDays: 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      indicator: this.indicators.get(ind4Id),
      policy: {
        onConditionMet: { action: "RELEASE_TO_RECIPIENT", destinationChain: "NEAR" },
        onConditionViolated: { action: "ROUTE_TO_CLAIM_RECIPIENT", requiresManualReview: false },
        onInconclusive: { action: "ALLOW_RESCAN_UNTIL_DEADLINE" },
        onExpiry: { action: "AUTO_REFUND_TO_SENDER" },
        requiresManualReview: false,
      },
    });
  }
}

export const inMemoryDb = new InMemoryDatabase();
