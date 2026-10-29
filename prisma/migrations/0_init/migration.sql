-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'OPERATOR', 'AUDITOR');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('DRAFT', 'AWAITING_FUNDING', 'ACTIVE', 'CONDITION_MET', 'CONDITION_VIOLATED', 'INCONCLUSIVE', 'SETTLED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PrivacyLevel" AS ENUM ('STANDARD', 'STRICT');

-- CreateEnum
CREATE TYPE "IndicatorType" AS ENUM ('TEMPERATURE', 'HUMIDITY', 'TAMPER', 'SHOCK', 'UV', 'BIOCHEMICAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'VERIFIED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ClassificationOutcome" AS ENUM ('CONDITION_MET', 'CONDITION_VIOLATED', 'INCONCLUSIVE');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'QUOTED', 'SIGNING', 'SUBMITTED', 'SETTLED', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "near_account_id" TEXT,
    "external_wallet_address" TEXT,
    "display_name" TEXT,
    "email_hash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrows" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "sender_account" TEXT NOT NULL,
    "recipient_account" TEXT NOT NULL,
    "claim_recipient_account" TEXT,
    "asset_symbol" TEXT NOT NULL,
    "asset_amount" DECIMAL(28,8) NOT NULL,
    "currency" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "EscrowStatus" NOT NULL DEFAULT 'AWAITING_FUNDING',
    "policy_hash" TEXT NOT NULL,
    "privacy_level" "PrivacyLevel" NOT NULL DEFAULT 'STANDARD',
    "media_retention_days" INTEGER NOT NULL DEFAULT 30,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escrows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicators" (
    "id" TEXT NOT NULL,
    "escrow_id" TEXT NOT NULL,
    "indicator_type" "IndicatorType" NOT NULL,
    "manufacturer" TEXT,
    "batch_reference" TEXT,
    "expected_state" TEXT NOT NULL,
    "failure_state" TEXT NOT NULL,
    "binding_hash" TEXT NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_sessions" (
    "id" TEXT NOT NULL,
    "escrow_id" TEXT NOT NULL,
    "indicator_id" TEXT NOT NULL,
    "verifier_user_id" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "image_storage_key" TEXT NOT NULL,
    "image_hash" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "attestation_reference" TEXT NOT NULL,
    "response_signature_reference" TEXT NOT NULL,
    "classification" "ClassificationOutcome",
    "confidence" DECIMAL(5,4),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "verification_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlement_policies" (
    "id" TEXT NOT NULL,
    "escrow_id" TEXT NOT NULL,
    "on_condition_met" JSONB NOT NULL,
    "on_condition_violated" JSONB NOT NULL,
    "on_inconclusive" JSONB NOT NULL,
    "on_expiry" JSONB NOT NULL,
    "requires_manual_review" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settlement_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" TEXT NOT NULL,
    "escrow_id" TEXT NOT NULL,
    "verification_session_id" TEXT,
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "destination_chain" TEXT NOT NULL,
    "destination_account" TEXT NOT NULL,
    "asset_symbol" TEXT NOT NULL,
    "asset_amount" DECIMAL(28,8) NOT NULL,
    "intent_reference" TEXT,
    "transaction_reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "escrow_id" TEXT,
    "event_type" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "ip_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_near_account_id_key" ON "users"("near_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "escrows_public_id_key" ON "escrows"("public_id");

-- CreateIndex
CREATE INDEX "escrows_status_idx" ON "escrows"("status");
CREATE INDEX "escrows_creator_id_idx" ON "escrows"("creator_id");
CREATE INDEX "escrows_deadline_idx" ON "escrows"("deadline");

-- CreateIndex
CREATE INDEX "indicators_escrow_id_idx" ON "indicators"("escrow_id");

-- CreateIndex
CREATE INDEX "verification_sessions_escrow_id_idx" ON "verification_sessions"("escrow_id");
CREATE INDEX "verification_sessions_indicator_id_idx" ON "verification_sessions"("indicator_id");

-- CreateIndex
CREATE UNIQUE INDEX "settlement_policies_escrow_id_key" ON "settlement_policies"("escrow_id");

-- CreateIndex
CREATE INDEX "settlements_escrow_id_idx" ON "settlements"("escrow_id");

-- CreateIndex
CREATE INDEX "audit_events_escrow_id_idx" ON "audit_events"("escrow_id");
CREATE INDEX "audit_events_event_type_idx" ON "audit_events"("event_type");
CREATE INDEX "audit_events_created_at_idx" ON "audit_events"("created_at");

-- AddForeignKey
ALTER TABLE "escrows" ADD CONSTRAINT "escrows_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicators" ADD CONSTRAINT "indicators_escrow_id_fkey" FOREIGN KEY ("escrow_id") REFERENCES "escrows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_sessions" ADD CONSTRAINT "verification_sessions_escrow_id_fkey" FOREIGN KEY ("escrow_id") REFERENCES "escrows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "verification_sessions" ADD CONSTRAINT "verification_sessions_indicator_id_fkey" FOREIGN KEY ("indicator_id") REFERENCES "indicators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "verification_sessions" ADD CONSTRAINT "verification_sessions_verifier_user_id_fkey" FOREIGN KEY ("verifier_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_policies" ADD CONSTRAINT "settlement_policies_escrow_id_fkey" FOREIGN KEY ("escrow_id") REFERENCES "escrows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_escrow_id_fkey" FOREIGN KEY ("escrow_id") REFERENCES "escrows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_verification_session_id_fkey" FOREIGN KEY ("verification_session_id") REFERENCES "verification_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_escrow_id_fkey" FOREIGN KEY ("escrow_id") REFERENCES "escrows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
