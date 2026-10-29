import React from "react";
import Link from "next/link";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { EscrowModel } from "@/lib/types";
import { StatusPill } from "./StatusPill";
import { Clock, ArrowRight, ShieldCheck, Tag } from "lucide-react";

interface EscrowCardProps {
  escrow: EscrowModel;
  className?: string;
}

export const EscrowCard: React.FC<EscrowCardProps> = ({ escrow, className }) => {
  const lastVerification = escrow.verificationSessions?.[escrow.verificationSessions.length - 1];
  const lastResult = lastVerification?.classification || "Pending scan";

  // Derive next action
  let nextAction = "Submit physical indicator scan";
  if (escrow.status === "AWAITING_FUNDING") {
    nextAction = "Lock funds into escrow to activate";
  } else if (escrow.status === "CONDITION_MET") {
    nextAction = "Initiate programmable release to recipient";
  } else if (escrow.status === "CONDITION_VIOLATED") {
    nextAction = escrow.policy?.onConditionViolated.requiresManualReview
      ? "Under operator dispute review"
      : "Route penalty funds to claim recipient";
  } else if (escrow.status === "SETTLED") {
    nextAction = "Settlement finalized and confirmed onchain";
  } else if (escrow.status === "EXPIRED") {
    nextAction = "Escrow expired; funds eligible for sender refund";
  } else if (escrow.status === "INCONCLUSIVE") {
    nextAction = "Rescan indicator with improved lighting";
  }

  return (
    <Link
      href={`/escrows/${escrow.publicId}`}
      className={cn(
        "group block rounded-xl border border-border bg-surface p-6 shadow-card transition-all duration-200",
        "hover:border-primary/50 hover:shadow-card-hover",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-sm font-semibold text-primary">{escrow.publicId}</span>
            <span className="text-border">·</span>
            <span className="text-xs text-ink-muted flex items-center gap-1">
              <Tag className="h-3 w-3" />
              <span>{escrow.assetCategory || "Commercial Asset"}</span>
            </span>
          </div>
          <h3 className="text-base font-semibold text-ink-primary group-hover:text-primary transition-colors">
            {escrow.title || `Condition Escrow ${escrow.publicId}`}
          </h3>
        </div>
        <StatusPill status={escrow.status} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-border/60 text-xs mb-4">
        <div>
          <span className="text-ink-muted block text-[11px] uppercase tracking-wider">Locked Amount</span>
          <span className="font-semibold text-ink-primary text-sm">
            {formatCurrency(escrow.assetAmount, escrow.assetSymbol)}
          </span>
        </div>
        <div>
          <span className="text-ink-muted block text-[11px] uppercase tracking-wider">Indicator Type</span>
          <span className="font-medium text-ink-primary capitalize">
            {escrow.indicator?.indicatorType.toLowerCase() || "Physical"}
          </span>
        </div>
        <div>
          <span className="text-ink-muted block text-[11px] uppercase tracking-wider">Last Outcome</span>
          <span className="font-medium text-ink-primary">{lastResult}</span>
        </div>
        <div>
          <span className="text-ink-muted block text-[11px] uppercase tracking-wider">Deadline</span>
          <span className="font-medium text-ink-primary flex items-center gap-1">
            <Clock className="h-3 w-3 text-ink-muted" />
            <span>{formatDate(escrow.deadline)}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs pt-1">
        <span className="text-ink-secondary">
          <strong className="text-ink-primary font-medium">Next Action:</strong> {nextAction}
        </span>
        <span className="flex items-center gap-1 font-medium text-primary group-hover:translate-x-0.5 transition-transform">
          <span>View Escrow</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
};
