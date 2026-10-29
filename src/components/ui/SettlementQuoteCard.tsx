"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { SolverQuote } from "@/lib/near-intents";
import { PrimaryButton } from "./Buttons";
import { ShieldCheck, Zap, ArrowRight, Clock } from "lucide-react";

interface SettlementQuoteCardProps {
  quote: SolverQuote;
  onApprove: (quote: SolverQuote) => void;
  loading?: boolean;
  className?: string;
}

export const SettlementQuoteCard: React.FC<SettlementQuoteCardProps> = ({
  quote,
  onApprove,
  loading,
  className,
}) => {
  return (
    <div className={cn("rounded-2xl border border-border bg-surface p-6 shadow-card space-y-5", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-2">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            NEAR Intents Solver Quote
          </span>
          <h3 className="text-base font-semibold text-ink-primary font-heading mt-0.5">
            {quote.solverName}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-status-success bg-status-success-soft/60 px-2.5 py-1 rounded border border-status-success/30">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Solver Reputation: {quote.reputationScore}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
        <div className="rounded-lg border border-border bg-surface-soft p-3">
          <span className="text-ink-muted uppercase tracking-wider text-[11px] block">Settlement Yield</span>
          <span className="text-sm font-bold text-ink-primary font-mono">{quote.netYieldAmount}</span>
        </div>
        <div className="rounded-lg border border-border bg-surface-soft p-3">
          <span className="text-ink-muted uppercase tracking-wider text-[11px] block">Solver Fee</span>
          <span className="text-sm font-bold text-ink-primary font-mono">${quote.estimatedFeeUsd}</span>
        </div>
        <div className="rounded-lg border border-border bg-surface-soft p-3 col-span-2 sm:col-span-1">
          <span className="text-ink-muted uppercase tracking-wider text-[11px] block">Est. Duration</span>
          <span className="text-sm font-bold text-ink-primary font-mono flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>~{quote.estimatedDurationSeconds} seconds</span>
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface-soft/60 p-3.5 text-xs space-y-1.5">
        <span className="text-ink-muted uppercase tracking-wider text-[11px] font-semibold block">
          Atomic Execution Route
        </span>
        <div className="flex flex-wrap items-center gap-2 text-ink-primary font-mono text-xs">
          {quote.route.map((step, idx) => (
            <React.Fragment key={idx}>
              <span className="bg-surface px-2 py-1 rounded border border-border font-medium">{step}</span>
              {idx < quote.route.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-ink-muted" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-ink-muted">
          Quote expires in <span className="font-mono text-ink-primary">5:00</span> · Signed via NEP-413
        </span>
        <PrimaryButton
          onClick={() => onApprove(quote)}
          loading={loading}
          icon={<Zap className="h-4 w-4" />}
        >
          Sign & Settle
        </PrimaryButton>
      </div>
    </div>
  );
};
