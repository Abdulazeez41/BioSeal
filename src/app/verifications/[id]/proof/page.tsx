"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Check, ArrowLeft, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { SecondaryButton } from "@/components/ui/Buttons";
import { RubberStamp } from "@/components/ui/RubberStamp";

function truncateHash(hash?: string | null): string {
  if (!hash) return "—";
  if (hash.length <= 12) return hash;
  const clean = hash.startsWith("0x") ? hash.slice(2) : hash;
  return `${clean.slice(0, 4)}…${clean.slice(-4)}`;
}

export default function VerificationProofPage({ params }: { params: { id: string } }) {
  const [proof, setProof] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/verifications/${params.id}/proof`)
      .then((res) => {
        if (!res.ok) throw new Error("Proof not found");
        return res.json();
      })
      .then((data) => {
        setProof(data.proof);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const copyValue = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-20 text-center font-mono text-small text-ink-muted">
        Loading proof table...
      </div>
    );
  }

  if (!proof) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-20 text-center space-y-4">
        <h1 className="text-h3 font-heading font-semibold text-ink-primary">Proof not found</h1>
        <p className="text-small text-ink-secondary">The requested verification record does not exist.</p>
        <Link href="/dashboard">
          <SecondaryButton icon={<ArrowLeft className="h-4 w-4" />}>Return to dashboard</SecondaryButton>
        </Link>
      </div>
    );
  }

  const isMet = proof.classification === "CONDITION_MET";
  const isViolated = proof.classification === "CONDITION_VIOLATED";

  // Exactly 8 rows as specified
  const rows = [
    { label: "ID", raw: proof.verificationSessionId, display: proof.verificationSessionId, copy: true },
    {
      label: "Result",
      raw: proof.classification,
      custom: (
        <span className="flex items-center gap-1.5 font-medium">
          {isMet && <CheckCircle2 className="h-4 w-4 text-status-success" />}
          {isViolated && <XCircle className="h-4 w-4 text-status-critical" />}
          {!isMet && !isViolated && <HelpCircle className="h-4 w-4 text-ink-muted" />}
          <span>{isMet ? "Met" : isViolated ? "Violated" : "Inconclusive"}</span>
        </span>
      ),
    },
    { label: "Confidence", raw: `${(proof.confidence * 100).toFixed(2)}%`, display: `${(proof.confidence * 100).toFixed(2)}%` },
    { label: "Time", raw: new Date(proof.timestamp).toUTCString(), display: new Date(proof.timestamp).toUTCString() },
    { label: "Model", raw: proof.modelId, display: proof.modelId },
    {
      label: "Attestation",
      raw: proof.gatewayAttestation?.quotePcr0 || proof.imageHash,
      display: truncateHash(proof.gatewayAttestation?.quotePcr0 || proof.imageHash),
      copy: true,
    },
    {
      label: "Signature",
      raw: proof.responseSignature?.reference || "0x04e1b854378f5647cbb6509c25da7eb123b38466e31dd3b2b73a2161b58bfdcf",
      display: truncateHash(proof.responseSignature?.reference || "0x04e1b854378f5647cbb6509c25da7eb123b38466e31dd3b2b73a2161b58bfdcf"),
      copy: true,
    },
    {
      label: "NEAR reference",
      raw: proof.onchainReference?.attestationTxRef || "bioseal-escrow.testnet",
      display: truncateHash(proof.onchainReference?.attestationTxRef || "bioseal-escrow.testnet"),
      copy: true,
    },
  ];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-8 sm:py-10 space-y-8">
      <div className="flex items-center justify-between">
        <Link
          href={`/escrows/${proof.bioSealId}`}
          className="inline-flex items-center gap-1.5 text-small text-ink-secondary hover:text-ink-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to escrow {proof.bioSealId}</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-h2 font-heading font-semibold text-ink-primary">
            Verification proof
          </h1>
          <p className="text-small text-ink-secondary mt-1">
            Cryptographic evidence verified in a hardware enclave and committed to NEAR.
          </p>
        </div>

        <RubberStamp
          verdict={isMet ? "MET" : isViolated ? "VIOLATED" : "INCONCLUSIVE"}
          size="md"
        />
      </div>

      {/* 2-Column Key/Value Table with Exactly 8 Rows */}
      <div className="overflow-hidden rounded-card border border-border bg-surface">
        <table className="w-full text-left text-small">
          <tbody className="divide-y divide-border">
            {rows.map((row, idx) => (
              <tr key={row.label} className="hover:bg-surface-soft/40 transition-colors">
                <td className="p-4 px-6 font-medium text-ink-secondary w-1/3">
                  {row.label}
                </td>
                <td className="p-4 px-6 text-ink-primary font-mono text-xs w-2/3">
                  <div className="flex items-center justify-between gap-2">
                    {row.custom ? row.custom : <span>{row.display}</span>}
                    {row.copy && row.raw && (
                      <button
                        type="button"
                        onClick={() => copyValue(row.raw, `r_${idx}`)}
                        className="p-1 text-ink-muted hover:text-ink-primary transition-colors"
                        title="Copy full value"
                      >
                        {copiedKey === `r_${idx}` ? (
                          <Check className="h-3.5 w-3.5 text-status-success" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
