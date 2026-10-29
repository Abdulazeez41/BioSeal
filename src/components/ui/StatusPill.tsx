import React from "react";
import { cn } from "@/lib/utils";
import { EscrowStatus, VerificationStatus, ClassificationOutcome } from "@/lib/types";

interface StatusPillProps {
  status: EscrowStatus | VerificationStatus | ClassificationOutcome | string;
  className?: string;
  size?: "sm" | "md";
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, className, size = "md" }) => {
  let bg = "bg-surface-soft text-ink-secondary border-border";
  let label = status.replace(/_/g, " ");

  switch (status) {
    case "ACTIVE":
    case "VERIFIED":
    case "SETTLED":
    case "CONDITION_MET":
      bg = "bg-[#EBF7EE] text-[#15803D] border-[#C3E8CA]";
      break;
    case "AWAITING_FUNDING":
    case "PENDING":
    case "PROCESSING":
    case "DRAFT":
      bg = "bg-[#FFF8E6] text-[#B45309] border-[#FCE19B]";
      break;
    case "CONDITION_VIOLATED":
    case "FAILED":
    case "CANCELLED":
    case "EXPIRED":
      bg = "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]";
      break;
    case "INCONCLUSIVE":
      bg = "bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]";
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-mono font-medium tracking-tight uppercase",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        bg,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      <span>{label}</span>
    </span>
  );
};
