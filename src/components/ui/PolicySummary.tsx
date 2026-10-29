import React from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { EscrowPolicyConfig } from "@/lib/types";
import { ArrowRight, ShieldAlert, CheckCircle2, Clock, HelpCircle } from "lucide-react";

interface PolicySummaryProps {
  policy: EscrowPolicyConfig;
  amount: string;
  symbol: string;
  recipientAccount: string;
  claimRecipientAccount?: string | null;
  senderAccount: string;
  className?: string;
}

export const PolicySummary: React.FC<PolicySummaryProps> = ({
  policy,
  amount,
  symbol,
  recipientAccount,
  claimRecipientAccount,
  senderAccount,
  className,
}) => {
  return (
    <div className={cn("rounded-xl border border-border bg-surface p-6 shadow-card space-y-5", className)}>
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">
          Settlement Policy in Plain Terms
        </h4>
        <span className="text-xs font-mono font-medium text-primary">
          Total Locked: {formatCurrency(amount, symbol)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Condition Met */}
        <div className="rounded-lg border border-border/80 bg-surface-soft/60 p-4 space-y-2">
          <div className="flex items-center gap-2 text-status-success text-xs font-semibold uppercase tracking-wider">
            <CheckCircle2 className="h-4 w-4" />
            <span>If Condition is Met</span>
          </div>
          <p className="text-sm text-ink-primary">
            Release 100% of escrow funds (
            <span className="font-semibold">{formatCurrency(amount, symbol)}</span>) to recipient:
          </p>
          <div className="font-mono text-xs text-ink-secondary bg-surface p-2 rounded border border-border truncate">
            {recipientAccount}
          </div>
          {policy.onConditionMet.destinationChain && (
            <div className="text-[11px] text-ink-muted">
              Settlement route: Destination chain <span className="font-medium text-ink-primary">{policy.onConditionMet.destinationChain}</span> via NEAR Intents.
            </div>
          )}
        </div>

        {/* Condition Violated */}
        <div className="rounded-lg border border-border/80 bg-surface-soft/60 p-4 space-y-2">
          <div className="flex items-center gap-2 text-status-critical text-xs font-semibold uppercase tracking-wider">
            <ShieldAlert className="h-4 w-4" />
            <span>If Condition is Violated</span>
          </div>
          <p className="text-sm text-ink-primary">
            {claimRecipientAccount ? (
              <>
                Route funds to claim recipient / insurer:
                <div className="font-mono text-xs text-ink-secondary bg-surface p-2 rounded border border-border truncate mt-1">
                  {claimRecipientAccount}
                </div>
              </>
            ) : (
              <>Refund 100% of escrow funds back to sender account:</>
            )}
          </p>
          <div className="text-[11px] text-ink-muted">
            {policy.onConditionViolated.requiresManualReview ? (
              <span className="text-status-warning font-medium">
                Requires operator manual dispute review before funds release.
              </span>
            ) : (
              <span>Automated atomic routing without human intervention.</span>
            )}
          </div>
        </div>

        {/* Inconclusive */}
        <div className="rounded-lg border border-border/80 bg-surface-soft/60 p-4 space-y-2">
          <div className="flex items-center gap-2 text-status-neutral text-xs font-semibold uppercase tracking-wider">
            <HelpCircle className="h-4 w-4" />
            <span>If Result is Inconclusive</span>
          </div>
          <p className="text-xs text-ink-secondary leading-relaxed">
            Funds remain secured in escrow. Authorized party may rescan indicator before the deadline expires.
            Maximum rescan attempts permitted: <span className="font-medium text-ink-primary">{policy.onInconclusive.maxRescans || 3}</span>.
          </p>
        </div>

        {/* Expiry */}
        <div className="rounded-lg border border-border/80 bg-surface-soft/60 p-4 space-y-2">
          <div className="flex items-center gap-2 text-status-warning text-xs font-semibold uppercase tracking-wider">
            <Clock className="h-4 w-4" />
            <span>If Deadline Passes</span>
          </div>
          <p className="text-xs text-ink-secondary leading-relaxed">
            If no conclusive verification is accepted before deadline, escrow automatically refunds locked funds back to sender:
            <span className="block font-mono text-[11px] text-ink-primary truncate mt-1">{senderAccount}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
