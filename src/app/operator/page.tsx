"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { EscrowModel, AuditEventModel } from "@/lib/types";
import { StatusPill } from "@/components/ui/StatusPill";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";
import { AuditEventRow } from "@/components/ui/AuditEventRow";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Activity,
  Zap,
  Lock,
  Layers,
  FileCheck,
} from "lucide-react";

export default function OperatorConsolePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowModel | null>(null);

  // Review Modal Form State
  const [reviewDecision, setReviewDecision] = useState<string>("UPHOLD_VIOLATION");
  const [writtenReason, setWrittenReason] = useState<string>("");
  const [policyRef, setPolicyRef] = useState<string>("POLICY-DISPUTE-RULE-04");
  const [confirmed, setConfirmed] = useState<boolean>(false);
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    fetch("/api/operator/escrows")
      .then((res) => {
        if (res.status === 403) {
          setAccessDenied(true);
          throw new Error("Access denied");
        }
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const submitReview = async () => {
    if (!selectedEscrow) return;
    if (writtenReason.trim().length < 15) {
      setFormError("Written reason must be at least 15 characters explaining physical evidence.");
      return;
    }
    if (!confirmed) {
      setFormError("You must explicitly confirm this binding dispute decision.");
      return;
    }

    setSubmittingReview(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/operator/escrows/${selectedEscrow.publicId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: reviewDecision,
          writtenReason,
          policyReference: policyRef,
          explicitConfirmation: true,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Review failed");

      setReviewSuccess(`Decision ${reviewDecision} executed for escrow ${selectedEscrow.publicId}`);
      setSelectedEscrow(null);
      setWrittenReason("");
      setConfirmed(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-20 text-center font-mono text-xs text-ink-muted">
        Authenticating operator clearance...
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-20 text-center space-y-4 max-w-xl mx-auto">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-status-critical/10 text-status-critical border border-status-critical/20">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold font-heading text-ink-primary">Restricted Operator Access</h2>
        <p className="text-xs text-ink-secondary leading-relaxed">
          The Operator Console is restricted to authenticated OPERATOR and AUDITOR roles. Use the persona switcher in the navigation bar to switch to Marcus Brody (Operator) or Veritas Auditor for demonstration access.
        </p>
      </div>
    );
  }

  const stats = data?.stats;
  const reviewQueue = data?.reviewQueue || [];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-8 sm:py-10 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-2">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            Compliance & Dispute Resolution
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-ink-primary mt-0.5">
            Operator Review Console
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-status-success" />
          <span className="text-xs font-mono text-ink-secondary">Operator Session Active</span>
        </div>
      </div>

      {reviewSuccess && (
        <div className="rounded-xl border border-status-success/30 bg-status-success-soft p-4 text-xs font-medium text-status-success flex items-center justify-between">
          <span>{reviewSuccess}</span>
          <button onClick={() => setReviewSuccess(null)} className="underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Infrastructure & Enclave Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              NEAR AI TEE Status
            </span>
            <Cpu className="h-4 w-4 text-status-success" />
          </div>
          <span className="text-sm font-bold text-ink-primary block font-mono">
            {stats?.nearAiTeeStatus || "OPERATIONAL"}
          </span>
          <span className="text-[11px] text-ink-secondary block">
            Hardware quoting enclaves verifying 100% of vision inferences.
          </span>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              NEAR Intents Solver Network
            </span>
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-bold text-ink-primary block font-mono">
            {stats?.nearIntentsSolverStatus || "OPERATIONAL"}
          </span>
          <span className="text-[11px] text-ink-secondary block">
            Wintermute & Flowdesk cross-chain liquidity solvers active.
          </span>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Consensus Node Health
            </span>
            <Activity className="h-4 w-4 text-status-success" />
          </div>
          <span className="text-sm font-bold text-ink-primary block font-mono">
            {stats?.nearRpcHealth || "HEALTHY"}
          </span>
          <span className="text-[11px] text-ink-secondary block">
            bioseal-escrow.testnet contract state in sync.
          </span>
        </div>
      </div>

      {/* Manual Review Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div>
            <h3 className="text-base font-semibold text-ink-primary font-heading">
              Verification & Violation Review Queue ({reviewQueue.length})
            </h3>
            <p className="text-xs text-ink-secondary mt-0.5">
              Escrows requiring human operator inspection due to condition violation, ambiguity, or strict review policy.
            </p>
          </div>
        </div>

        {reviewQueue.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-xs text-ink-muted">
            Review queue is clear. No escrows currently require manual dispute review.
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden shadow-card">
            {reviewQueue.map((escrow: EscrowModel) => (
              <div key={escrow.publicId} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary">{escrow.publicId}</span>
                    <span className="text-border">·</span>
                    <span className="text-xs font-semibold text-ink-primary">{escrow.title}</span>
                    <StatusPill status={escrow.status} size="sm" />
                  </div>
                  <p className="text-xs text-ink-secondary">
                    Indicator: <span className="font-medium text-ink-primary">{escrow.indicator?.indicatorType}</span> ({escrow.indicator?.manufacturer}) · Amount: <span className="font-mono font-bold text-ink-primary">{formatCurrency(escrow.assetAmount, escrow.assetSymbol)}</span>
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    Sender: <span className="font-mono">{escrow.senderAccount}</span> · Recipient: <span className="font-mono">{escrow.recipientAccount}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <PrimaryButton
                    onClick={() => {
                      setSelectedEscrow(escrow);
                      setFormError(null);
                    }}
                    icon={<FileCheck className="h-4 w-4" />}
                  >
                    Review Case
                  </PrimaryButton>
                  <Link href={`/escrows/${escrow.publicId}`}>
                    <SecondaryButton>View Escrow</SecondaryButton>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Review Modal */}
      {selectedEscrow && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedEscrow(null)}
          title={`Dispute Review: ${selectedEscrow.publicId}`}
          description={`Binding adjudicative decision for ${selectedEscrow.title}`}
          maxWidth="lg"
        >
          <div className="space-y-5 text-xs text-ink-primary">
            <div className="rounded-lg border border-border bg-surface-soft p-3.5 space-y-1 font-mono text-[11px]">
              <div>Locked Amount: {formatCurrency(selectedEscrow.assetAmount, selectedEscrow.assetSymbol)}</div>
              <div>Current Status: {selectedEscrow.status}</div>
              <div>Indicator: {selectedEscrow.indicator?.indicatorType}</div>
              <div>Policy Hash: {selectedEscrow.policyHash}</div>
            </div>

            <div>
              <label className="font-semibold uppercase tracking-wider text-ink-secondary block mb-1">
                Adjudication Decision
              </label>
              <select
                value={reviewDecision}
                onChange={(e) => setReviewDecision(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-primary focus:outline-none focus:border-primary"
              >
                <option value="UPHOLD_VIOLATION">Uphold Condition Violation (Route to Claim Recipient)</option>
                <option value="OVERRIDE_CONDITION_MET">Override to Condition Met (Release to Recipient)</option>
                <option value="ORDER_PHYSICAL_INSPECTION">Order Independent Laboratory Re-test</option>
              </select>
            </div>

            <div>
              <label className="font-semibold uppercase tracking-wider text-ink-secondary block mb-1">
                Written Adjudication Reason (Required - Minimum 15 characters)
              </label>
              <textarea
                rows={3}
                value={writtenReason}
                onChange={(e) => setWrittenReason(e.target.value)}
                placeholder="Detail optical findings, sensor calibration reports, or tamper shear evidence..."
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="font-semibold uppercase tracking-wider text-ink-secondary block mb-1">
                Policy Clause Reference
              </label>
              <input
                type="text"
                value={policyRef}
                onChange={(e) => setPolicyRef(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-primary focus:outline-none focus:border-primary font-mono"
              />
            </div>

            <div className="rounded-lg border border-border bg-surface-soft p-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4 mt-0.5"
                />
                <span className="text-[11px] leading-relaxed text-ink-secondary">
                  I explicitly confirm that I have reviewed the physical indicator evidence and hardware attestation quote, and authorize this irrevocable settlement update. An immutable audit record will be signed with my operator key.
                </span>
              </label>
            </div>

            {formError && (
              <div className="rounded-lg border border-status-critical/30 bg-status-critical-soft p-3 text-status-critical text-xs">
                {formError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <SecondaryButton onClick={() => setSelectedEscrow(null)}>Cancel</SecondaryButton>
              <PrimaryButton onClick={submitReview} loading={submittingReview}>
                Commit Adjudication Decision
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
