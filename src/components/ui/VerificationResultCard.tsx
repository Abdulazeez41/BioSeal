import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ClassificationOutcome } from "@/lib/types";
import { CheckCircle2, ShieldAlert, AlertCircle, ArrowRight, RotateCcw, ExternalLink } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "./Buttons";
import { RubberStamp } from "./RubberStamp";

interface VerificationResultCardProps {
  outcome: ClassificationOutcome;
  confidence: number;
  explanation: string;
  evidenceNotes?: string[];
  publicId: string;
  sessionId: string;
  nextAction?: string;
  onRetry?: () => void;
  className?: string;
}

export const VerificationResultCard: React.FC<VerificationResultCardProps> = ({
  outcome,
  confidence,
  explanation,
  evidenceNotes = [],
  publicId,
  sessionId,
  nextAction,
  onRetry,
  className,
}) => {
  const isMet = outcome === "CONDITION_MET";
  const isViolated = outcome === "CONDITION_VIOLATED";
  const isInconclusive = outcome === "INCONCLUSIVE";

  return (
    <div
      className={cn(
        "rounded-2xl border p-6 sm:p-8 shadow-card transition-all",
        isMet && "border-[#C3E8CA] bg-[#FAFDFB]",
        isViolated && "border-[#FECACA] bg-[#FEFDFD]",
        isInconclusive && "border-border bg-surface",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
              isMet && "bg-[#EBF7EE] text-[#15803D]",
              isViolated && "bg-[#FEE2E2] text-[#B91C1C]",
              isInconclusive && "bg-surface-soft text-ink-secondary"
            )}
          >
            {isMet && <CheckCircle2 className="h-6 w-6" />}
            {isViolated && <ShieldAlert className="h-6 w-6" />}
            {isInconclusive && <AlertCircle className="h-6 w-6" />}
          </div>

          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-ink-muted block">
              Hardware-Verified Inference Result
            </span>
            <h2
              className={cn(
                "text-2xl font-bold font-heading mt-0.5",
                isMet && "text-[#15803D]",
                isViolated && "text-[#B91C1C]",
                isInconclusive && "text-ink-primary"
              )}
            >
              {isMet && "The protected condition was satisfied."}
              {isViolated && "The protected condition was not satisfied."}
              {isInconclusive && "The indicator could not be classified reliably."}
            </h2>
            <span className="text-xs font-mono text-ink-secondary mt-1 block">
              Model Confidence: {(confidence * 100).toFixed(2)}% · Confidential TEE Inference
            </span>
          </div>
        </div>

        <div className="self-center sm:self-start shrink-0">
          <RubberStamp
            verdict={isMet ? "MET" : isViolated ? "VIOLATED" : "INCONCLUSIVE"}
            size="sm"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-surface p-4 text-xs space-y-2 mb-6">
        <span className="text-ink-muted uppercase tracking-wider font-semibold text-[11px] block">
          Inference Explanation
        </span>
        <p className="text-sm text-ink-primary leading-relaxed font-sans">{explanation}</p>

        {evidenceNotes.length > 0 && (
          <ul className="list-disc list-inside space-y-1 text-ink-secondary pt-2 border-t border-border/60">
            {evidenceNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        )}
      </div>

      {nextAction && (
        <div className="rounded-xl border border-primary/20 bg-primary-light/40 p-4 mb-6 text-xs text-ink-primary">
          <strong className="font-semibold text-primary block uppercase tracking-wider text-[11px] mb-1">
            Settlement Action
          </strong>
          <span>{nextAction}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-3">
          <Link href={`/verifications/${sessionId}/proof`}>
            <SecondaryButton icon={<ExternalLink className="h-4 w-4" />}>
              View Cryptographic Proof
            </SecondaryButton>
          </Link>

          <Link href={`/escrows/${publicId}`}>
            <SecondaryButton>Return to Escrow</SecondaryButton>
          </Link>
        </div>

        {isInconclusive && onRetry && (
          <PrimaryButton onClick={onRetry} icon={<RotateCcw className="h-4 w-4" />}>
            Rescan Indicator
          </PrimaryButton>
        )}

        {isMet && (
          <Link href={`/escrows/${publicId}?tab=settlement`}>
            <PrimaryButton icon={<ArrowRight className="h-4 w-4" />}>
              Execute Settlement
            </PrimaryButton>
          </Link>
        )}
      </div>
    </div>
  );
};
