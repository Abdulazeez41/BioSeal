"use client";

import React, { useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Copy, Check, Terminal, Code2, ShieldCheck, Cpu, Zap, Database } from "lucide-react";

export default function DocsPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyCode = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-8 sm:py-10 space-y-12">
      <SectionHeading
        caption="BioSeal Core Protocol"
        title="Developer & Integration Documentation"
        description="Comprehensive technical reference for programmatically creating escrows, registering physical indicators, verifying confidential TEE inferences, and executing cross-chain settlements via NEAR Intents."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sticky Table of Contents */}
        <div className="lg:col-span-1 hidden lg:block">
          <div className="sticky top-24 rounded-xl border border-border bg-surface p-4 text-xs space-y-2 font-medium text-ink-secondary">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted block pb-1 border-b border-border">
              Documentation Index
            </span>
            <a href="#architecture" className="block hover:text-primary transition-colors">1. Architecture Overview</a>
            <a href="#authentication" className="block hover:text-primary transition-colors">2. Authentication Guide</a>
            <a href="#lifecycle" className="block hover:text-primary transition-colors">3. Escrow Lifecycle</a>
            <a href="#indicator-api" className="block hover:text-primary transition-colors">4. Indicator Registration</a>
            <a href="#verification-api" className="block hover:text-primary transition-colors">5. Verification API</a>
            <a href="#near-ai" className="block hover:text-primary transition-colors">6. NEAR AI TEE Quoting</a>
            <a href="#near-intents" className="block hover:text-primary transition-colors">7. NEAR Intents SDK</a>
            <a href="#error-codes" className="block hover:text-primary transition-colors">8. Error Codes & Limits</a>
            <a href="#security" className="block hover:text-primary transition-colors">9. Security & Privacy Model</a>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-12 text-ink-primary text-sm leading-relaxed">
          {/* Section 1: Architecture Overview */}
          <section id="architecture" className="space-y-4">
            <h2 className="text-xl font-bold font-heading text-ink-primary border-b border-border pb-2">
              1. Architecture Overview
            </h2>
            <p>
              BioSeal bridges irreversible physical or biochemical changes with programmable onchain liquidity. The system coordinates three decoupled layers:
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs text-ink-secondary pl-2">
              <li>
                <strong className="text-ink-primary">Physical Chemistry Layer:</strong> Irreversible dyes, micro-holographic shear void labels, cobalt-free relative humidity cards, or lateral-flow assays attached to physical assets.
              </li>
              <li>
                <strong className="text-ink-primary">Confidential Inference Layer (NEAR AI TEE):</strong> Hardware-isolated computation (Intel SGX2 / AMD SEV-SNP) that receives an encrypted image, measures fiducials, and issues a cryptographic hardware quote proving the inference was unmanipulated.
              </li>
              <li>
                <strong className="text-ink-primary">Consensus & Settlement Layer (NEAR Protocol & Intents):</strong> The smart contract <code className="bg-surface-soft px-1.5 py-0.5 rounded font-mono text-primary">bioseal-escrow.testnet</code> holds escrow policy rules and settles cross-chain via decentralized solver auction.
              </li>
            </ul>
          </section>

          {/* Section 2: Authentication */}
          <section id="authentication" className="space-y-4">
            <h2 className="text-xl font-bold font-heading text-ink-primary border-b border-border pb-2">
              2. Authentication & Session Management
            </h2>
            <p className="text-xs text-ink-secondary">
              BioSeal uses signed NEP-413 / JWT session tokens. Authenticated requests pass the session token via HTTP-only cookie or bearer header:
            </p>

            <div className="rounded-xl border border-border bg-[#161513] text-white p-4 font-mono text-xs overflow-x-auto relative">
              <button
                onClick={() => copyCode(`curl -X POST https://bioseal.network/api/auth/session \\\n  -H "Content-Type: application/json" \\\n  -d '{"nearAccountId": "alice_biopharma.testnet", "role": "USER"}'`, "auth-curl")}
                className="absolute right-3 top-3 p-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
              >
                {copiedKey === "auth-curl" ? <Check className="h-4 w-4 text-status-success" /> : <Copy className="h-4 w-4" />}
              </button>
              <pre className="text-xs text-white/90">{`curl -X POST https://bioseal.network/api/auth/session \\
  -H "Content-Type: application/json" \\
  -d '{"nearAccountId": "alice_biopharma.testnet", "role": "USER"}'`}</pre>
            </div>
          </section>

          {/* Section 3: Escrow Lifecycle */}
          <section id="lifecycle" className="space-y-4">
            <h2 className="text-xl font-bold font-heading text-ink-primary border-b border-border pb-2">
              3. Escrow Lifecycle & States
            </h2>
            <p className="text-xs text-ink-secondary">
              An escrow progresses through deterministic states:
            </p>
            <div className="overflow-hidden rounded-xl border border-border bg-surface text-xs">
              <table className="w-full text-left divide-y divide-border">
                <thead className="bg-surface-soft font-mono font-semibold">
                  <tr>
                    <th className="p-3">State</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Permitted Next Transitions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono text-[11px]">
                  <tr>
                    <td className="p-3 text-status-warning font-semibold">AWAITING_FUNDING</td>
                    <td className="p-3 font-sans text-xs">Agreement drafted and registered; awaiting deposit lock.</td>
                    <td className="p-3">ACTIVE, CANCELLED</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-status-success font-semibold">ACTIVE</td>
                    <td className="p-3 font-sans text-xs">Liquidity locked. Physical indicator monitoring in progress.</td>
                    <td className="p-3">CONDITION_MET, CONDITION_VIOLATED, INCONCLUSIVE, EXPIRED</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-status-success font-semibold">CONDITION_MET</td>
                    <td className="p-3 font-sans text-xs">Indicator verified intact by TEE. Ready for recipient release.</td>
                    <td className="p-3">SETTLED</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-status-critical font-semibold">CONDITION_VIOLATED</td>
                    <td className="p-3 font-sans text-xs">Threshold breach verified. Ready for claim routing / review.</td>
                    <td className="p-3">SETTLED, OPERATOR_REVIEW</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-status-neutral font-semibold">INCONCLUSIVE</td>
                    <td className="p-3 font-sans text-xs">Glare, blur, or obstruction prevented definitive inference.</td>
                    <td className="p-3">ACTIVE (Rescan), EXPIRED</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-primary font-semibold">SETTLED</td>
                    <td className="p-3 font-sans text-xs">Atomic funds payout completed via NEAR contract / Intents solver.</td>
                    <td className="p-3">TERMINAL</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4: Create & Register Escrow */}
          <section id="indicator-api" className="space-y-4">
            <h2 className="text-xl font-bold font-heading text-ink-primary border-b border-border pb-2">
              4. Create Escrow & Register Indicator API
            </h2>
            <div className="rounded-xl border border-border bg-[#161513] text-white p-4 font-mono text-xs overflow-x-auto relative">
              <button
                onClick={() => copyCode(`// Complete TypeScript Escrow Creation
import { BioSealClient } from "@bioseal/sdk";

const client = new BioSealClient({
  networkId: "testnet",
  contractId: "bioseal-escrow.testnet"
});

const escrow = await client.createEscrow({
  title: "Clinical Trial Cold-Chain Consignment",
  assetCategory: "Pharmaceuticals",
  senderAccount: "alice_biopharma.testnet",
  recipientAccount: "geneva_central_hospital.testnet",
  claimRecipientAccount: "zurich_cargo_insurance.testnet",
  deadline: new Date(Date.now() + 5 * 86400000).toISOString(),
  indicator: {
    indicatorType: "TEMPERATURE",
    expectedState: "Reaction window uniform baseline white (+2°C to +8°C maintained)",
    failureState: "Magenta-purple activation dye release (> +8°C breached)",
    manufacturer: "Thermax CryoSystems",
    batchReference: "TX-2026-C44"
  },
  policy: {
    assetSymbol: "USDC",
    assetAmount: "50000.00",
    destinationChain: "Arbitrum",
    onConditionMet: { action: "RELEASE_TO_RECIPIENT" },
    onConditionViolated: { action: "ROUTE_TO_CLAIM_RECIPIENT", requiresManualReview: false },
    onInconclusive: { action: "ALLOW_RESCAN_UNTIL_DEADLINE" },
    onExpiry: { action: "AUTO_REFUND_TO_SENDER" }
  }
});

console.log("Created BioSeal ID:", escrow.publicId);
console.log("Binding Hash:", escrow.bindingHash);`, "create-code")}
                className="absolute right-3 top-3 p-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
              >
                {copiedKey === "create-code" ? <Check className="h-4 w-4 text-status-success" /> : <Copy className="h-4 w-4" />}
              </button>
              <pre className="text-xs text-white/90">{`// Complete TypeScript Escrow Creation
import { BioSealClient } from "@bioseal/sdk";

const client = new BioSealClient({
  networkId: "testnet",
  contractId: "bioseal-escrow.testnet"
});

const escrow = await client.createEscrow({
  title: "Clinical Trial Cold-Chain Consignment",
  assetCategory: "Pharmaceuticals",
  senderAccount: "alice_biopharma.testnet",
  recipientAccount: "geneva_central_hospital.testnet",
  claimRecipientAccount: "zurich_cargo_insurance.testnet",
  deadline: new Date(Date.now() + 5 * 86400000).toISOString(),
  indicator: {
    indicatorType: "TEMPERATURE",
    expectedState: "Reaction window uniform baseline white (+2°C to +8°C maintained)",
    failureState: "Magenta-purple activation dye release (> +8°C breached)",
    manufacturer: "Thermax CryoSystems",
    batchReference: "TX-2026-C44"
  },
  policy: {
    assetSymbol: "USDC",
    assetAmount: "50000.00",
    destinationChain: "Arbitrum",
    onConditionMet: { action: "RELEASE_TO_RECIPIENT" },
    onConditionViolated: { action: "ROUTE_TO_CLAIM_RECIPIENT", requiresManualReview: false },
    onInconclusive: { action: "ALLOW_RESCAN_UNTIL_DEADLINE" },
    onExpiry: { action: "AUTO_REFUND_TO_SENDER" }
  }
});

console.log("Created BioSeal ID:", escrow.publicId);
console.log("Binding Hash:", escrow.bindingHash);`}</pre>
            </div>
          </section>

          {/* Section 5: Verification API */}
          <section id="verification-api" className="space-y-4">
            <h2 className="text-xl font-bold font-heading text-ink-primary border-b border-border pb-2">
              5. Private Verification API
            </h2>
            <p className="text-xs text-ink-secondary">
              Submits a base64 scan buffer for confidential classification in NEAR AI TEE:
            </p>
            <div className="rounded-xl border border-border bg-[#161513] text-white p-4 font-mono text-xs overflow-x-auto relative">
              <button
                onClick={() => copyCode(`// Verification Submission Request
const response = await fetch("https://bioseal.network/api/verifications", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    escrowPublicId: "BIO-9402",
    imageBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD..."
  })
});

const result = await response.json();
console.log("Outcome:", result.verificationSession.classification);
console.log("Attestation Quote PCR0:", result.attestation.quoteSummary.pcr0);`, "verify-code")}
                className="absolute right-3 top-3 p-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
              >
                {copiedKey === "verify-code" ? <Check className="h-4 w-4 text-status-success" /> : <Copy className="h-4 w-4" />}
              </button>
              <pre className="text-xs text-white/90">{`// Verification Submission Request
const response = await fetch("https://bioseal.network/api/verifications", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    escrowPublicId: "BIO-9402",
    imageBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD..."
  })
});

const result = await response.json();
console.log("Outcome:", result.verificationSession.classification);
console.log("Attestation Quote PCR0:", result.attestation.quoteSummary.pcr0);`}</pre>
            </div>
          </section>

          {/* Section 6: NEAR AI TEE Quoting */}
          <section id="near-ai" className="space-y-4">
            <h2 className="text-xl font-bold font-heading text-ink-primary border-b border-border pb-2">
              6. NEAR AI TEE Attestation Verification
            </h2>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Before accepting model output, BioSeal validates hardware quotes against Intel PCS or AMD KDS attestation roots. The measurement register PCR0 must match the open enclave build hash:
            </p>
            <div className="rounded-xl border border-border bg-surface-soft p-4 font-mono text-xs space-y-1.5">
              <div>Enclave Type: Intel SGX2 / AMD SEV-SNP Confidential VM</div>
              <div>MRSIGNER: 0x4a7e93b169524f0c72e2cf6f76c5b96791e2b6da08d8102462e7834a36f5e821</div>
              <div>Weights SHA256: 0xd8c21a4f0015ecf364119d854aa1974720938ff6a2444005b820fb741279ce5b</div>
              <div>Report Data: SHA256(SessionID + IndicatorType + ImageDigest)</div>
            </div>
          </section>

          {/* Section 7: NEAR Intents SDK */}
          <section id="near-intents" className="space-y-4">
            <h2 className="text-xl font-bold font-heading text-ink-primary border-b border-border pb-2">
              7. NEAR Intents Cross-Chain Settlement
            </h2>
            <p className="text-xs text-ink-secondary">
              NEAR Intents enables cross-chain deposit and multi-chain settlement without wrapping tokens or exposing bridge vulnerabilities:
            </p>
            <div className="rounded-xl border border-border bg-[#161513] text-white p-4 font-mono text-xs overflow-x-auto relative">
              <pre className="text-xs text-white/90">{`// Submitting an approved intent payload to solver relay
import { IntentsClient } from "@near-intents/devkit";

const client = new IntentsClient({
  relayUrl: "https://solver-relay.near-intents.org/v1",
  verifierContract: "intents.near"
});

const intentStatus = await client.submitIntent({
  intentPayload: payload,
  signature: userSignatureHex
});

console.log("Solver Commited:", intentStatus.solverAccount);
console.log("Atomic Verification Tx:", intentStatus.txHashOnNear);`}</pre>
            </div>
          </section>

          {/* Section 8: Error Codes */}
          <section id="error-codes" className="space-y-4">
            <h2 className="text-xl font-bold font-heading text-ink-primary border-b border-border pb-2">
              8. Protocol Error Codes & Rate Limits
            </h2>
            <div className="overflow-hidden rounded-xl border border-border bg-surface text-xs">
              <table className="w-full text-left divide-y divide-border font-mono text-[11px]">
                <thead className="bg-surface-soft font-semibold">
                  <tr>
                    <th className="p-3">Error Code</th>
                    <th className="p-3">HTTP</th>
                    <th className="p-3">Remediation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="p-3 text-status-critical font-semibold">ERR_OPTICAL_GLARE_OBSTRUCTION</td>
                    <td className="p-3">422</td>
                    <td className="p-3 font-sans">Retake scan. Specular reflection exceeds 35% threshold.</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-status-critical font-semibold">ERR_TEE_ATTESTATION_MISMATCH</td>
                    <td className="p-3">422</td>
                    <td className="p-3 font-sans">Enclave signature failed silicon attestation verification.</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-status-warning font-semibold">ERR_ESCROW_DEADLINE_PASSED</td>
                    <td className="p-3">400</td>
                    <td className="p-3 font-sans">Escrow window expired. Funds are locked for sender refund.</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-status-warning font-semibold">ERR_RATE_LIMIT_EXCEEDED</td>
                    <td className="p-3">429</td>
                    <td className="p-3 font-sans">Limit of 20 verifications / minute per IP exceeded.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 9: Security */}
          <section id="security" className="space-y-4">
            <h2 className="text-xl font-bold font-heading text-ink-primary border-b border-border pb-2">
              9. Security & Privacy Model
            </h2>
            <p className="text-xs text-ink-secondary leading-relaxed">
              BioSeal implements strict zero-trust boundary isolation. Client browsers never possess contract private keys; signing is handled via user-connected wallets (Privy / Dynamic / NEAR Wallet Selector). Images are encrypted immediately with AES-256-GCM in client memory before transit. Hardware enclaves process only non-identifying derived tensors.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
