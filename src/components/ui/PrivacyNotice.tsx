import React from "react";
import { cn } from "@/lib/utils";
import { EyeOff, ShieldCheck, Database, Lock } from "lucide-react";

interface PrivacyNoticeProps {
  className?: string;
  variant?: "panel" | "inline";
}

export const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({ className, variant = "panel" }) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface-soft/80 p-5 shadow-sm text-sm text-ink-primary",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
        <EyeOff className="h-4 w-4" />
        <span>What BioSeal Can See</span>
      </div>

      <p className="text-xs text-ink-secondary mb-4 leading-relaxed">
        BioSeal is engineered around mathematical data minimization. Zero commercial terms, manifests, or identities are sent to the AI model or published onchain.
      </p>

      <ul className="space-y-2.5 text-xs text-ink-secondary">
        <li className="flex items-start gap-2.5">
          <Lock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>
            <strong className="text-ink-primary font-medium">Private Inference:</strong> The indicator image is processed strictly inside an encrypted hardware enclave (TEE).
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-status-success shrink-0 mt-0.5" />
          <span>
            <strong className="text-ink-primary font-medium">Hardware-Backed Attestation:</strong> The AI classification is verified through cryptographic Intel SGX / AMD SEV-SNP quotes.
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <EyeOff className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>
            <strong className="text-ink-primary font-medium">Zero Identity Leakage:</strong> Customer names, email addresses, delivery locations, and shipment manifests are never placed onchain.
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <Database className="h-4 w-4 text-ink-primary shrink-0 mt-0.5" />
          <span>
            <strong className="text-ink-primary font-medium">Minimal Onchain Disclosure:</strong> Only an SHA-256 state hash and an attestation reference are permanently recorded on NEAR.
          </span>
        </li>
      </ul>
    </div>
  );
};
