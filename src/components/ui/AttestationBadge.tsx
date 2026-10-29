import React from "react";
import { cn } from "@/lib/utils";
import { ShieldCheck, Cpu, CheckCircle2 } from "lucide-react";

interface AttestationBadgeProps {
  type?: "TEE_SGX" | "TEE_SEV" | "NEAR_CONTRACT" | "RESPONSE_SIG";
  verified?: boolean;
  className?: string;
  label?: string;
}

export const AttestationBadge: React.FC<AttestationBadgeProps> = ({
  type = "TEE_SGX",
  verified = true,
  className,
  label,
}) => {
  const defaultLabel =
    label ||
    (type === "TEE_SGX"
      ? "Hardware TEE Quoting (Intel SGX2)"
      : type === "TEE_SEV"
      ? "Hardware TEE Quoting (AMD SEV-SNP)"
      : type === "NEAR_CONTRACT"
      ? "Recorded on NEAR Protocol"
      : "Cryptographic Enclave Signature");

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono font-medium border",
        verified
          ? "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]"
          : "bg-surface-soft text-ink-muted border-border",
        className
      )}
    >
      {type === "NEAR_CONTRACT" ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
      ) : type === "RESPONSE_SIG" ? (
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
      ) : (
        <Cpu className="h-3.5 w-3.5 text-[#166534]" />
      )}
      <span>{defaultLabel}</span>
    </div>
  );
};
