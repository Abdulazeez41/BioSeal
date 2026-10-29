"use client";

import React, { useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PrivacyNotice } from "@/components/ui/PrivacyNotice";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";
import {
  ShieldCheck,
  Lock,
  Database,
  Trash2,
  FileCheck,
  AlertTriangle,
  Clock,
  EyeOff,
  Scale,
} from "lucide-react";

export default function PrivacyPage() {
  const [purgeKey, setPurgeKey] = useState("");
  const [purgeStatus, setPurgeStatus] = useState<string | null>(null);

  const handleMediaPurge = () => {
    if (!purgeKey.trim()) return;
    setPurgeStatus(`Verification media for ${purgeKey} marked for immediate cryptographic wipe.`);
    setPurgeKey("");
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-8 sm:py-10 space-y-12">
      <SectionHeading
        caption="Security Architecture & Data Protection"
        title="Privacy & Verification Security"
        description="BioSeal treats privacy as core financial infrastructure. Learn how data minimization, hardware-backed confidential computing, and cryptographic attestations protect commercial confidentiality."
      />

      <PrivacyNotice />

      <div className="space-y-10 text-sm text-ink-primary leading-relaxed">
        {/* 1. Onchain vs Offchain */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold font-heading text-ink-primary border-b border-border pb-2">
            1. What BioSeal Stores Onchain vs. Offchain
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Database className="h-4 w-4" />
                <span>Minimal Public Onchain Data (NEAR)</span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-ink-secondary">
                <li>Unique BioSeal Public ID (e.g. BIO-9402)</li>
                <li>Participant Wallet Accounts (Sender, Recipient)</li>
                <li>SHA-256 Settlement Policy Hash</li>
                <li>Physical Indicator Category & Binding Hash</li>
                <li>Consensus Escrow Status & Result Code</li>
                <li>Hardware Enclave Attestation Reference</li>
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-status-success">
                <Lock className="h-4 w-4" />
                <span>Protected Offchain Data (Encrypted Storage)</span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-ink-secondary">
                <li>AES-256-GCM Encrypted Scan Image Buffers</li>
                <li>Confidential Cargo Manifest Descriptions</li>
                <li>High-resolution calibration fiducial metrics</li>
                <li>Redacted, IP-hashed access audit logs</li>
                <li>Automatic expiration schedule for media purging</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 2. What is Sent to NEAR AI */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold font-heading text-ink-primary border-b border-border pb-2">
            2. Confidential Computing: What is Shared with NEAR AI
          </h2>
          <p className="text-xs text-ink-secondary">
            When a user verifies a physical indicator, the model receives only:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-ink-secondary pl-2">
            <li>The indicator image or privacy-minimized derived pixel tensors.</li>
            <li>The indicator category (e.g., TEMPERATURE, TAMPER).</li>
            <li>Expected baseline and threshold failure criteria.</li>
            <li>An anonymous non-identifying verification session ID.</li>
          </ul>
          <p className="text-xs text-ink-secondary">
            Personal identities, financial amounts, shipping manifests, and delivery addresses are NEVER transmitted to the inference engine.
          </p>
        </section>

        {/* 3. Hardware Attestation */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold font-heading text-ink-primary border-b border-border pb-2">
            3. How Hardware-Backed Attestation Works
          </h2>
          <p className="text-xs text-ink-secondary leading-relaxed">
            Inference runs inside a Trusted Execution Environment (Intel SGX2 / AMD SEV-SNP). Before processing, BioSeal verifies the gateway hardware quote. The processor itself signs a cryptographically verifiable measurement proving that the exact published model code executed without tampering or eavesdropping by the host operating system or cloud provider.
          </p>
        </section>

        {/* 4. Retention & User-Initiated Deletion */}
        <section id="retention" className="space-y-4">
          <h2 className="text-xl font-bold font-heading text-ink-primary border-b border-border pb-2">
            4. Media Retention Windows & Deletion Rights
          </h2>
          <p className="text-xs text-ink-secondary leading-relaxed">
            Escrow creators configure an image retention window (7, 30, or 90 days) tailored to their dispute resolution cycle. Upon expiration, the raw image buffer is permanently overwritten.
          </p>

          <div id="deletion" className="rounded-xl border border-border bg-surface p-6 shadow-card space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-ink-primary font-heading flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-status-critical" />
                <span>Delete My Verification Media</span>
              </h3>
              <p className="text-xs text-ink-secondary mt-1">
                Authorized parties may request immediate cryptographic erasure of verification image media before the retention period expires:
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                placeholder="Enter BioSeal ID or Verification Session ID"
                value={purgeKey}
                onChange={(e) => setPurgeKey(e.target.value)}
                className="w-full sm:w-80 rounded-lg border border-border bg-surface-soft px-3 py-2 text-xs font-mono text-ink-primary focus:outline-none focus:border-primary"
              />
              <PrimaryButton onClick={handleMediaPurge}>
                Purge Verification Media
              </PrimaryButton>
            </div>

            {purgeStatus && (
              <div className="rounded-lg border border-status-success/30 bg-status-success-soft p-3 text-xs text-status-success">
                {purgeStatus}
              </div>
            )}
          </div>
        </section>

        {/* 5. Inconclusive & Dispute Resolution */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold font-heading text-ink-primary border-b border-border pb-2">
            5. Inconclusive Verifications & Escrow Expiry
          </h2>
          <div className="space-y-3 text-xs text-ink-secondary leading-relaxed">
            <p>
              <strong className="text-ink-primary">Inconclusive Scans:</strong> If optical specular reflection, extreme blur, or physical obstruction prevents high-confidence classification (&gt;90%), BioSeal returns an <code className="bg-surface-soft px-1.5 py-0.5 rounded font-mono">INCONCLUSIVE</code> outcome. Funds remain securely locked, and the verifier is invited to submit a clearer scan before the deadline.
            </p>
            <p>
              <strong className="text-ink-primary">Deadline Expiration:</strong> If no conclusive physical indicator verification is submitted before the agreed deadline, the smart contract automatically refunds 100% of the locked liquidity back to the creator wallet.
            </p>
            <p>
              <strong className="text-ink-primary">Dispute Resolution:</strong> If an escrow policy requires manual review for violation consequences, authorized operators and compliance auditors review optical evidence and calibration logs, committing an immutable onchain adjudication statement.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
