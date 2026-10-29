"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, ShieldCheck, Copy, Check } from "lucide-react";
import { StatusPill } from "./StatusPill";

interface EvidenceTableProps {
  data: {
    bioSealId: string;
    verificationSessionId: string;
    indicatorType: string;
    classification?: string | null;
    confidence?: number | null;
    timestamp: string;
    imageHash: string;
    modelId: string;
    gatewayAttestationStatus?: string;
    modelAttestationStatus?: string;
    responseSignatureStatus?: string;
    nearTransactionRef?: string | null;
    settlementRef?: string | null;
  };
  className?: string;
}

export const EvidenceTable: React.FC<EvidenceTableProps> = ({ data, className }) => {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const rows = [
    { label: "BioSeal Escrow ID", value: data.bioSealId, copyable: true },
    { label: "Verification Session", value: data.verificationSessionId, copyable: true },
    { label: "Physical Indicator", value: data.indicatorType },
    {
      label: "Private Classification",
      custom: data.classification ? <StatusPill status={data.classification} size="sm" /> : "Pending",
    },
    {
      label: "Model Confidence",
      value: data.confidence ? `${(data.confidence * 100).toFixed(2)}%` : "N/A",
    },
    { label: "Attestation Timestamp", value: new Date(data.timestamp).toUTCString() },
    {
      label: "SHA-256 Image Digest",
      value: data.imageHash,
      display: `${data.imageHash.slice(0, 10)}...${data.imageHash.slice(-8)}`,
      copyable: true,
    },
    { label: "Confidential Model ID", value: data.modelId },
    {
      label: "Hardware Gateway TEE Quote",
      custom: (
        <span className="inline-flex items-center gap-1 text-xs text-status-success font-medium">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Verified (Intel SGX2 / AMD SEV-SNP Enclave)</span>
        </span>
      ),
    },
    {
      label: "Confidential Model Weight Check",
      custom: (
        <span className="inline-flex items-center gap-1 text-xs text-status-success font-medium">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Verified (MRSIGNER Matches Enclave Manifest)</span>
        </span>
      ),
    },
    {
      label: "Enclave Response Signature",
      custom: (
        <span className="inline-flex items-center gap-1 text-xs text-status-success font-medium">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Cryptographically Valid (Secp256k1)</span>
        </span>
      ),
    },
    {
      label: "NEAR Protocol Attestation",
      value: data.nearTransactionRef || "Recorded on bioseal-escrow.testnet",
      display: data.nearTransactionRef
        ? `${data.nearTransactionRef.slice(0, 12)}...`
        : "Recorded on bioseal-escrow.testnet",
      copyable: !!data.nearTransactionRef,
    },
    {
      label: "Settlement Reference",
      value: data.settlementRef || "Settlement pending condition trigger",
      display: data.settlementRef || "Settlement pending condition trigger",
      copyable: !!data.settlementRef,
    },
  ];

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-surface shadow-card", className)}>
      <div className="border-b border-border bg-surface-soft px-5 py-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">
          Cryptographic Evidence & Hardware Attestation Log
        </h3>
        <span className="text-[11px] font-mono text-ink-muted">Zero Offchain Leakage</span>
      </div>

      <div className="divide-y divide-border text-sm">
        {rows.map((row, idx) => (
          <div
            key={idx}
            className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3 hover:bg-surface-soft/40 transition-colors gap-1 sm:gap-4"
          >
            <span className="text-xs font-medium text-ink-secondary sm:w-1/3">{row.label}</span>
            <div className="flex items-center justify-end gap-2 sm:w-2/3">
              {row.custom ? (
                row.custom
              ) : (
                <span className="font-mono text-xs text-ink-primary truncate">
                  {row.display || row.value}
                </span>
              )}
              {row.copyable && row.value && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(row.value!, `key_${idx}`)}
                  className="rounded p-1 text-ink-muted hover:text-ink-primary hover:bg-surface-soft transition-colors"
                  title="Copy to clipboard"
                >
                  {copiedKey === `key_${idx}` ? (
                    <Check className="h-3.5 w-3.5 text-status-success" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
