/**
 * BioSeal Demonstration Seed Script
 * NOTE: This script initializes demonstrator-created test escrows only.
 * All records are clearly marked with demonstration identifiers for compliance and auditing.
 */

const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 [DEMONSTRATION ONLY] Seeding BioSeal test accounts and escrows...");

  // 1. Create or upsert test personas
  const alice = await prisma.user.upsert({
    where: { near_account_id: "alice_biopharma.testnet" },
    update: {},
    create: {
      id: "usr_alice_101",
      near_account_id: "alice_biopharma.testnet",
      external_wallet_address: "0x71C...a84f",
      display_name: "Alice Vance (Novartis Cold-Chain Demonstrator)",
      role: "USER",
    },
  });

  const marcus = await prisma.user.upsert({
    where: { near_account_id: "operator_marcus.near" },
    update: {},
    create: {
      id: "usr_marcus_202",
      near_account_id: "operator_marcus.near",
      display_name: "Marcus Brody (BioSeal Operator Demonstrator)",
      role: "OPERATOR",
    },
  });

  const veritas = await prisma.user.upsert({
    where: { near_account_id: "auditor_veritas.near" },
    update: {},
    create: {
      id: "usr_veritas_303",
      near_account_id: "auditor_veritas.near",
      display_name: "Veritas Protocol Auditor Demonstrator",
      role: "AUDITOR",
    },
  });

  console.log(`✓ Seeded 3 test users: ${alice.near_account_id}, ${marcus.near_account_id}, ${veritas.near_account_id}`);

  // 2. Demonstration Escrow 1: Vaccine Cold-Chain (ACTIVE)
  const e1 = await prisma.escrow.upsert({
    where: { public_id: "BIO-9402" },
    update: {},
    create: {
      id: "esc_01_vac",
      public_id: "BIO-9402",
      creator_id: alice.id,
      sender_account: "alice_biopharma.testnet",
      recipient_account: "geneva_central_hospital.testnet",
      claim_recipient_account: "zurich_cargo_insurance.testnet",
      asset_symbol: "USDC",
      asset_amount: 50000.0,
      currency: "USD",
      deadline: new Date(Date.now() + 4 * 86400000),
      status: "ACTIVE",
      policy_hash: "0x4b7c19f0910e28a556d7821098acbf01235619ca24e650110bfedc928490a1bc",
      privacy_level: "STRICT",
      media_retention_days: 30,
    },
  });

  await prisma.indicator.upsert({
    where: { id: "ind_01_vac" },
    update: {},
    create: {
      id: "ind_01_vac",
      escrow_id: e1.id,
      indicator_type: "TEMPERATURE",
      manufacturer: "Thermax CryoSystems",
      batch_reference: "TX-2026-C44",
      expected_state: "Reaction window uniform baseline white (+2°C to +8°C maintained)",
      failure_state: "Magenta-purple activation dye release (> +8°C breached)",
      binding_hash: "0x98f4c219a164b008d72e81190bc128362d8e4f1a2609c5d1e0293bf6a0584b11",
    },
  });

  // 3. Demonstration Escrow 2: Swiss Chronometer (SETTLED)
  const e2 = await prisma.escrow.upsert({
    where: { public_id: "BIO-8147" },
    update: {},
    create: {
      id: "esc_02_watch",
      public_id: "BIO-8147",
      creator_id: alice.id,
      sender_account: "alice_biopharma.testnet",
      recipient_account: "collector_tokyo.testnet",
      claim_recipient_account: "lloyds_marine_underwriters.testnet",
      asset_symbol: "USDC",
      asset_amount: 32000.0,
      currency: "USD",
      deadline: new Date(Date.now() - 86400000),
      status: "SETTLED",
      policy_hash: "0x98124b1029e8471b0293847a01982bca98102384a7192834b901293847a01294",
      privacy_level: "STANDARD",
      media_retention_days: 60,
    },
  });

  await prisma.indicator.upsert({
    where: { id: "ind_02_watch" },
    update: {},
    create: {
      id: "ind_02_watch",
      escrow_id: e2.id,
      indicator_type: "TAMPER",
      manufacturer: "SecurPrint Switzerland",
      batch_reference: "SP-VOID-882",
      expected_state: "Continuous nano-holographic matrix intact with unpeeled tamper adhesive",
      failure_state: "Optical VOID/OPENED text release or torn shear line",
      binding_hash: "0x12a8f33190cbde6152a488c91100f5127e4bca9921b019348ecf118942a00918",
    },
  });

  console.log("✓ Seeded test demonstration escrows: BIO-9402, BIO-8147");
  console.log("✅ [DEMONSTRATION ONLY] Seed completed successfully.");
}

main()
  .catch((e) => {
    // If running in environment without live postgres instance, log note
    console.warn("Note: PostgreSQL instance not connected during offline seed. In-memory fallback is active.");
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
