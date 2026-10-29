export type UserRole = "USER" | "OPERATOR" | "AUDITOR";

export type EscrowStatus =
  | "DRAFT"
  | "AWAITING_FUNDING"
  | "ACTIVE"
  | "CONDITION_MET"
  | "CONDITION_VIOLATED"
  | "INCONCLUSIVE"
  | "SETTLED"
  | "CANCELLED"
  | "EXPIRED";

export type PrivacyLevel = "STANDARD" | "STRICT";

export type IndicatorType =
  | "TEMPERATURE"
  | "HUMIDITY"
  | "TAMPER"
  | "SHOCK"
  | "UV"
  | "BIOCHEMICAL"
  | "CUSTOM";

export type VerificationStatus =
  | "PENDING"
  | "PROCESSING"
  | "VERIFIED"
  | "FAILED"
  | "EXPIRED";

export type ClassificationOutcome =
  | "CONDITION_MET"
  | "CONDITION_VIOLATED"
  | "INCONCLUSIVE";

export type SettlementStatus =
  | "PENDING"
  | "QUOTED"
  | "SIGNING"
  | "SUBMITTED"
  | "SETTLED"
  | "FAILED"
  | "REFUNDED";

export interface UserSession {
  id: string;
  nearAccountId?: string | null;
  externalWalletAddress?: string | null;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export interface EscrowPolicyConfig {
  onConditionMet: {
    action: "RELEASE_TO_RECIPIENT" | "SPLIT_PAYMENT" | "HOLD";
    percentageToRecipient?: number;
    destinationChain?: string;
  };
  onConditionViolated: {
    action: "ROUTE_TO_CLAIM_RECIPIENT" | "REFUND_TO_SENDER" | "HOLD_FOR_MANUAL_REVIEW";
    claimAllocationPercentage?: number;
    requiresManualReview: boolean;
  };
  onInconclusive: {
    action: "ALLOW_RESCAN_UNTIL_DEADLINE" | "HOLD_FOR_AUDIT";
    maxRescans?: number;
  };
  onExpiry: {
    action: "AUTO_REFUND_TO_SENDER" | "ROUTE_TO_CLAIM_RECIPIENT";
  };
  requiresManualReview: boolean;
}

export interface EscrowModel {
  id: string;
  publicId: string;
  creatorId: string;
  title?: string;
  assetCategory?: string;
  senderAccount: string;
  recipientAccount: string;
  claimRecipientAccount?: string | null;
  assetSymbol: string;
  assetAmount: string;
  currency: string;
  deadline: string;
  status: EscrowStatus;
  policyHash: string;
  privacyLevel: PrivacyLevel;
  mediaRetentionDays: number;
  createdAt: string;
  updatedAt: string;
  indicator?: IndicatorModel;
  policy?: EscrowPolicyConfig;
  settlements?: SettlementModel[];
  verificationSessions?: VerificationSessionModel[];
}

export interface IndicatorModel {
  id: string;
  escrowId: string;
  indicatorType: IndicatorType;
  manufacturer?: string | null;
  batchReference?: string | null;
  expectedState: string;
  failureState: string;
  bindingHash: string;
  registeredAt: string;
  bindingMethod?: "QR_CODE" | "NFC_TAG" | "MANUAL_ID";
}

export interface VerificationSessionModel {
  id: string;
  escrowId: string;
  indicatorId: string;
  verifierUserId?: string | null;
  status: VerificationStatus;
  imageStorageKey: string;
  imageHash: string;
  modelId: string;
  attestationReference: string;
  responseSignatureReference: string;
  classification?: ClassificationOutcome | null;
  confidence?: number | null;
  explanation?: string;
  evidenceNotes?: string[];
  gatewayAttestationVerified?: boolean;
  modelAttestationVerified?: boolean;
  signatureVerified?: boolean;
  createdAt: string;
  completedAt?: string | null;
}

export interface SettlementModel {
  id: string;
  escrowId: string;
  verificationSessionId?: string | null;
  status: SettlementStatus;
  destinationChain: string;
  destinationAccount: string;
  assetSymbol: string;
  assetAmount: string;
  intentReference?: string | null;
  transactionReference?: string | null;
  feeEstimate?: string;
  solverId?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string | null;
}

export interface AuditEventModel {
  id: string;
  actorId?: string | null;
  actorAccount?: string | null;
  escrowId?: string | null;
  eventType: string;
  metadata: Record<string, unknown>;
  ipHash?: string | null;
  createdAt: string;
}

export interface NearAiInferenceRequest {
  sessionId: string;
  indicatorType: IndicatorType;
  expectedState: string;
  failureState: string;
  imageCiphertextBase64: string;
  imageHash: string;
  privacyLevel: PrivacyLevel;
}

export interface NearAiInferenceResponse {
  sessionId: string;
  classification: ClassificationOutcome;
  confidence: number;
  explanation: string;
  evidenceNotes: string[];
  machineResultCode: string;
  modelId: string;
  gatewayAttestation: {
    status: "VERIFIED" | "FAILED";
    quotePcr0: string;
    enclaveMrSigner: string;
    teeType: "INTEL_SGX" | "AMD_SEV_SNP";
    timestamp: string;
  };
  modelAttestation: {
    status: "VERIFIED" | "FAILED";
    modelWeightsSha256: string;
    enclaveReportData: string;
  };
  responseSignature: {
    status: "VERIFIED" | "FAILED";
    signatureHex: string;
    signerPublicKey: string;
  };
  attestationReference: string;
}
