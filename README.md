# BioSeal — Condition-Based Settlement Layer on NEAR

> **Physical proof. Private intelligence. Programmable settlement.**  
> *Chemistry becomes the oracle. NEAR becomes the settlement layer.*

BioSeal turns an irreversible physical or biochemical indicator into a private, verifiable condition for releasing money. A buyer, seller, carrier, insurer, or autonomous agent can place funds into an escrow. The funds are released, held, or routed to a claim recipient only after a physical indicator is scanned and classified by private AI running in a hardware-backed trusted execution environment (TEE).

---

## Key Capabilities

1. **Irreversible Physical Oracles**: Supports temperature-sensitive labels (cold-chain), cobalt-free humidity cards, destructive holographic tamper seals, mechanical shock impact sensors, UV exposure strips, and lateral flow biochemical assays.
2. **Confidential AI Inference (NEAR AI TEE)**: Scans are processed inside hardware-isolated enclaves (Intel SGX2 / AMD SEV-SNP) via NEAR AI. Hardware attestation quotes (PCR0 / MRSIGNER) and enclave ECDSA response signatures are cryptographically validated before any outcome is accepted.
3. **Minimal Onchain Disclosure**: Personal identities, delivery addresses, customer names, and raw images are NEVER stored onchain. Only an SHA-256 state hash and an attestation reference are permanently recorded on NEAR.
4. **Cross-Chain Liquidity via NEAR Intents**: Supports native NEAR settlement and atomic solver-routed funding/payouts across Ethereum, Arbitrum, Base, and Solana via the NEAR Intents SDK.
5. **NEAR Smart Contract (`bioseal-escrow`)**: Production-ready Rust contract managing the complete condition escrow lifecycle with state transitions, event logs, and programmatic payouts.
6. **Operator & Auditor Console**: Role-gated dispute resolution console requiring written rationale, policy clause citation, reviewer key confirmation, and signed immutable audit events.

---

## Architecture Topology

```
┌────────────────────────┐      ┌──────────────────────────┐      ┌─────────────────────────┐
│   Physical Indicator   │ ───> │ Camera Edge Scan         │ ───> │ Client-Side AES-256-GCM │
│ (Dye, Void Seal, LFA)  │      │ (Blur / Glare Detection) │      │ (No PII Transmitted)    │
└────────────────────────┘      └──────────────────────────┘      └─────────────────────────┘
                                                                               │
                                                                               ▼
┌────────────────────────┐      ┌──────────────────────────┐      ┌─────────────────────────┐
│ NEAR Protocol Contract │ <─── │ Cryptographic Attestation│ <─── │ NEAR AI TEE Enclave     │
│ (bioseal-escrow.testnet│      │ (PCR0 Quote + Signature) │      │ (Intel SGX2 / AMD SEV)  │
└────────────────────────┘      └──────────────────────────┘      └─────────────────────────┘
            │
            ▼
┌────────────────────────┐
│ NEAR Intents Solvers   │ ───> Atomic Multi-Chain Payout (NEAR, Arbitrum, Base, Ethereum)
└────────────────────────┘
```

---

## Directory Structure

```
BioSeal/
├── contracts/
│   └── bioseal-escrow/             # NEAR Protocol smart contract (Rust)
│       ├── Cargo.toml
│       └── src/lib.rs              # create_escrow, fund, register_indicator, verify, resolve
├── prisma/
│   ├── schema.prisma               # PostgreSQL Prisma Schema
│   ├── seed.js                     # Demonstrator-created test escrows seed script
│   └── migrations/0_init/          # SQL DDL migrations
├── src/
│   ├── app/
│   │   ├── api/                    # REST APIs (Zod validation, audit logging, rate limits)
│   │   │   ├── auth/               # Session login/logout/me
│   │   │   ├── escrows/            # Escrow CRUD, fund, cancel, expire, events
│   │   │   ├── verifications/      # Confidential inference & attestation proofs
│   │   │   ├── settlements/        # NEAR Intents solver quotes & execution
│   │   │   ├── operator/           # Adjudication queue & audit logs
│   │   │   └── near-status/        # Infrastructure health telemetry
│   │   ├── create/page.tsx         # 4-step escrow wizard
│   │   ├── dashboard/page.tsx      # Escrow portfolio dashboard
│   │   ├── docs/page.tsx           # Developer SDK & API docs
│   │   ├── escrows/[publicId]/     # Multi-tab escrow detail & QR label
│   │   ├── operator/page.tsx       # Operator dispute console
│   │   ├── privacy/page.tsx        # Privacy whitepaper & media purge
│   │   ├── status/page.tsx         # Live telemetry & RPC status
│   │   ├── verify/page.tsx         # WebRTC camera scanner
│   │   └── verifications/[id]/     # Cryptographic proof certificate
│   ├── components/
│   │   ├── 3d/HeroScene.tsx        # React Three Fiber 3D interactive hero
│   │   ├── layout/GlassNavbar.tsx  # Apple-style glass navbar & persona switcher
│   │   ├── layout/Footer.tsx       # Standard footer
│   │   ├── ui/                     # Reusable design system components
│   │   └── verification/           # CameraScanner WebRTC component
│   ├── lib/
│   │   ├── auth/                   # Scoped session tokens & role RBAC
│   │   ├── audit/                  # Sanitized structured audit events (OTel ready)
│   │   ├── chain-signatures/       # NEAR MPC multi-chain execution
│   │   ├── db/                     # Prisma & resilient transactional store
│   │   ├── jobs/                   # Durable background worker queue
│   │   ├── near/                   # NEAR contract client connector
│   │   ├── near-ai/                # Confidential TEE inference & hardware quoting
│   │   ├── near-intents/           # Solver quote negotiation & execution
│   │   ├── rate-limit/             # Token bucket IP limiter
│   │   └── storage/                # AES-256-GCM encrypted object store
│   └── test/                       # Vitest test suite
├── .env.example                    # Environment variable configuration template
├── package.json
├── tailwind.config.ts
└── vitest.config.ts
```

---

## Quickstart & Local Setup

### 1. Prerequisites
- Node.js >= 18.0.0
- pnpm >= 9.0.0 (or npm)
- PostgreSQL (optional: application contains a resilient fallback store)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/BioSeal/BioSeal.git
cd BioSeal

# Install dependencies
pnpm install

# Generate Prisma Client
pnpm prisma:generate
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Key configuration parameters:
- `NEXT_PUBLIC_NEAR_NETWORK_ID`: `testnet`
- `NEXT_PUBLIC_NEAR_CONTRACT_ID`: `bioseal-escrow.testnet`
- `NEAR_AI_TEE_GATEWAY_URL`: `https://tee.near.ai/verify`
- `NEAR_AI_MODEL_ID`: `bioseal-indicator-vision-v2-tee`
- `STORAGE_MASTER_KEY`: 32-byte hex key for AES-256-GCM image encryption

### 4. Running the Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing

Run the test suite covering escrow creation, confidential inference, policy routing, and role-based access control:
```bash
pnpm test
```

Test coverage includes:
- `src/test/escrow.test.ts`: Escrow initialization, policy hashes, onchain contract states.
- `src/test/near-ai.test.ts`: Hardware TEE gateway quotes, MRSIGNER validation, forged quote rejection.
- `src/test/policy.test.ts`: ConditionMet release, ConditionViolated insurance routing, NEAR Intents quotes.
- `src/test/access-control.test.ts`: Session tokens, data minimization, log redaction, IP rate limiting.

---

## Smart Contract Compilation (`contracts/bioseal-escrow`)

The contract is written in Rust using `near-sdk 5.5.0`.
```bash
cd contracts/bioseal-escrow
cargo check
cargo build --target wasm32-unknown-unknown --release
```

Deploying to NEAR Testnet:
```bash
near contract deploy bioseal-escrow.testnet use-file ./target/wasm32-unknown-unknown/release/bioseal_escrow.wasm with-init-call new json-args '{"owner":"admin.testnet","authorized_tee_enclave":"tee-enclave.near-ai.testnet"}' prepaid-gas '100.0 Tgas' attached-deposit '0 NEAR' network-config testnet sign-with-keychain
```

---

## Production Deployment

### Vercel / Cloudflare Pages / Docker
```bash
# Build production bundle
pnpm build

# Start production server
pnpm start
```

For containerized environments, expose port `3000` with standard health checks on `/api/near-status`.
