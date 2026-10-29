"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EscrowModel } from "@/lib/types";
import { StatusPill } from "@/components/ui/StatusPill";
import { QRBindingCard } from "@/components/ui/QRBindingCard";
import { PolicySummary } from "@/components/ui/PolicySummary";
import { SettlementQuoteCard } from "@/components/ui/SettlementQuoteCard";
import { AuditEventRow } from "@/components/ui/AuditEventRow";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Camera,
  Coins,
  ShieldCheck,
  ExternalLink,
  Zap,
} from "lucide-react";

function EscrowDetailContent({ params }: { params: { publicId: string } }) {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as any) || "overview";

  const [activeTab, setActiveTab] = useState<"overview" | "verification" | "policy" | "audit">(
    ["overview", "verification", "policy", "audit"].includes(initialTab) ? initialTab : "overview"
  );
  const [escrow, setEscrow] = useState<EscrowModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(false);
  const [settling, setSettling] = useState(false);
  const [quoteData, setQuoteData] = useState<any>(null);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchEscrow();
    fetchEvents();
  }, [params.publicId]);

  const fetchEscrow = () => {
    fetch(`/api/escrows/${params.publicId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Escrow not found");
        return res.json();
      })
      .then((data) => {
        setEscrow(data.escrow);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const fetchEvents = () => {
    fetch(`/api/escrows/${params.publicId}/events`)
      .then((res) => res.json())
      .then((data) => {
        setAuditEvents(data.auditEvents || []);
      })
      .catch(() => {});
  };

  const fundEscrow = async () => {
    setFunding(true);
    try {
      const res = await fetch(`/api/escrows/${params.publicId}/fund`, { method: "POST" });
      if (res.ok) {
        setActionNotice("Funds locked in escrow on NEAR.");
        fetchEscrow();
      }
    } finally {
      setFunding(false);
    }
  };

  const requestSettlementQuotes = async () => {
    if (!escrow) return;
    setSettling(true);
    try {
      const res = await fetch(`/api/escrows/${params.publicId}/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationChain: escrow.policy?.onConditionMet.destinationChain || "NEAR",
          destinationAccount: escrow.recipientAccount,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuoteData(data);
      }
    } finally {
      setSettling(false);
    }
  };

  const executeSettlementApproval = async () => {
    if (!quoteData?.settlement?.id) return;
    setSettling(true);
    try {
      const res = await fetch(`/api/settlements/${quoteData.settlement.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureHex: "0xNEP413_SIGNED" }),
      });
      if (res.ok) {
        setActionNotice("Settlement executed via NEAR Intents.");
        fetchEscrow();
      }
    } finally {
      setSettling(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-20 text-center font-mono text-small text-ink-muted">
        Loading escrow...
      </div>
    );
  }

  if (!escrow) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-20 text-center space-y-4">
        <h1 className="text-h3 font-heading font-semibold text-ink-primary">Escrow not found</h1>
        <p className="text-small text-ink-secondary">The requested ID does not exist.</p>
        <Link href="/dashboard">
          <SecondaryButton icon={<ArrowLeft className="h-4 w-4" />}>Return to dashboard</SecondaryButton>
        </Link>
      </div>
    );
  }

  // Exactly four tabs as required: Overview, Verification, Policy, Audit
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "verification", label: `Verification & Settlement (${escrow.verificationSessions?.length || 0})` },
    { id: "policy", label: "Policy" },
    { id: "audit", label: `Audit (${auditEvents.length})` },
  ];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-8 sm:py-10 space-y-8">
      {/* Top Header */}
      <div className="space-y-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-small text-ink-secondary hover:text-ink-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to escrows</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-small font-semibold text-ink-primary">{escrow.publicId}</span>
              <StatusPill status={escrow.status} size="sm" />
            </div>
            <h1 className="text-h2 font-heading font-semibold text-ink-primary">
              {escrow.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {escrow.status === "AWAITING_FUNDING" && (
              <PrimaryButton onClick={fundEscrow} loading={funding} icon={<Coins className="h-4 w-4" />}>
                Lock funds
              </PrimaryButton>
            )}

            {(escrow.status === "ACTIVE" || escrow.status === "INCONCLUSIVE") && (
              <Link href={`/verify?escrowId=${escrow.publicId}`}>
                <PrimaryButton icon={<Camera className="h-4 w-4" />}>
                  Scan indicator
                </PrimaryButton>
              </Link>
            )}

            {escrow.status === "CONDITION_MET" && (
              <PrimaryButton onClick={() => setActiveTab("verification")} icon={<Zap className="h-4 w-4" />}>
                Release funds
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>

      {actionNotice && (
        <div className="rounded-card border border-border bg-surface p-4 text-small text-ink-primary flex items-center justify-between">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="underline text-xs text-ink-muted">
            Dismiss
          </button>
        </div>
      )}

      {/* Reduced 4 Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-border pb-px text-small font-medium">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-ink-secondary hover:text-ink-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================= 1. OVERVIEW (Includes Indicator) ================= */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Key Facts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-card border border-border bg-surface p-5">
              <span className="text-label uppercase text-ink-muted block font-semibold">Locked Amount</span>
              <span className="text-h3 font-heading font-semibold font-mono text-ink-primary mt-1 block">
                {formatCurrency(escrow.assetAmount, escrow.assetSymbol)}
              </span>
            </div>
            <div className="rounded-card border border-border bg-surface p-5">
              <span className="text-label uppercase text-ink-muted block font-semibold">Indicator</span>
              <span className="text-body font-medium text-ink-primary mt-1 block">
                {escrow.indicator?.indicatorType || "Physical"}
              </span>
            </div>
            <div className="rounded-card border border-border bg-surface p-5">
              <span className="text-label uppercase text-ink-muted block font-semibold">Deadline</span>
              <span className="text-small text-ink-primary mt-1 block">
                {formatDate(escrow.deadline)}
              </span>
            </div>
            <div className="rounded-card border border-border bg-surface p-5">
              <span className="text-label uppercase text-ink-muted block font-semibold">Status</span>
              <div className="mt-1">
                <StatusPill status={escrow.status} size="sm" />
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="rounded-card border border-border bg-surface p-6 space-y-4">
            <span className="text-label uppercase text-ink-muted font-semibold block">Participants</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-small">
              <div>
                <span className="text-xs text-ink-muted block">Sender (Funder)</span>
                <span className="font-mono text-ink-primary">{escrow.senderAccount}</span>
              </div>
              <div>
                <span className="text-xs text-ink-muted block">Recipient</span>
                <span className="font-mono text-ink-primary">{escrow.recipientAccount}</span>
              </div>
              <div>
                <span className="text-xs text-ink-muted block">Claim Recipient (Insurer)</span>
                <span className="font-mono text-ink-primary">{escrow.claimRecipientAccount || "None"}</span>
              </div>
            </div>
          </div>

          {/* Indicator Section (Moved into Overview) */}
          <div className="space-y-4">
            <span className="text-label uppercase text-ink-muted font-semibold block">Bound Physical Indicator</span>
            <QRBindingCard
              publicId={escrow.publicId}
              indicatorType={escrow.indicator?.indicatorType || "TEMPERATURE"}
              expectedState={escrow.indicator?.expectedState || "Baseline intact"}
              bindingHash={escrow.indicator?.bindingHash || "0x00"}
              deadline={escrow.deadline}
              status={escrow.status}
            />
          </div>
        </div>
      )}

      {/* ================= 2. VERIFICATION (Includes Settlement) ================= */}
      {activeTab === "verification" && (
        <div className="space-y-8">
          {/* Scan sessions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-label uppercase text-ink-muted font-semibold block">Verification Scans</span>
              <Link href={`/verify?escrowId=${escrow.publicId}`}>
                <PrimaryButton icon={<Camera className="h-4 w-4" />}>
                  Scan indicator
                </PrimaryButton>
              </Link>
            </div>

            {!escrow.verificationSessions || escrow.verificationSessions.length === 0 ? (
              <div className="rounded-card border border-border bg-surface p-8 text-center text-small text-ink-secondary">
                No scans recorded. Position indicator in camera to classify.
              </div>
            ) : (
              <div className="overflow-hidden rounded-card border border-border bg-surface divide-y divide-border">
                {escrow.verificationSessions.map((session) => (
                  <div key={session.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-small">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-ink-primary">{session.id}</span>
                        <StatusPill status={session.classification || "PENDING"} size="sm" />
                        <span className="font-mono text-xs text-ink-muted">
                          {(Number(session.confidence || 0) * 100).toFixed(1)}% confidence
                        </span>
                      </div>
                      <p className="text-ink-secondary">{session.explanation}</p>
                    </div>

                    <Link href={`/verifications/${session.id}/proof`}>
                      <SecondaryButton icon={<ExternalLink className="h-3.5 w-3.5" />}>
                        View proof
                      </SecondaryButton>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settlement Section (Moved into Verification) */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-label uppercase text-ink-muted font-semibold block">NEAR Intents Settlement</span>
              {escrow.status === "CONDITION_MET" && !quoteData && (
                <PrimaryButton onClick={requestSettlementQuotes} loading={settling} icon={<Zap className="h-4 w-4" />}>
                  Request settlement quote
                </PrimaryButton>
              )}
            </div>

            {quoteData?.quote && (
              <SettlementQuoteCard
                quote={quoteData.quote}
                onApprove={executeSettlementApproval}
                loading={settling}
              />
            )}

            {escrow.settlements && escrow.settlements.length > 0 && (
              <div className="overflow-hidden rounded-card border border-border bg-surface divide-y divide-border">
                {escrow.settlements.map((st) => (
                  <div key={st.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-small">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{st.id}</span>
                        <StatusPill status={st.status} size="sm" />
                      </div>
                      <p className="text-ink-secondary mt-1">
                        {formatCurrency(st.assetAmount, st.assetSymbol)} to {st.destinationChain} ({st.destinationAccount})
                      </p>
                    </div>
                    {st.transactionReference && (
                      <span className="font-mono text-xs text-ink-muted">
                        Tx: {st.transactionReference.slice(0, 10)}…
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 3. POLICY ================= */}
      {activeTab === "policy" && escrow.policy && (
        <div className="space-y-6">
          <PolicySummary
            policy={escrow.policy}
            amount={escrow.assetAmount}
            symbol={escrow.assetSymbol}
            recipientAccount={escrow.recipientAccount}
            claimRecipientAccount={escrow.claimRecipientAccount}
            senderAccount={escrow.senderAccount}
          />

          <div className="rounded-card border border-border bg-surface p-5 text-small">
            <span className="text-xs text-ink-muted block uppercase">Onchain Policy Hash (SHA-256)</span>
            <span className="font-mono text-xs text-ink-primary break-all block mt-1">
              {escrow.policyHash}
            </span>
          </div>
        </div>
      )}

      {/* ================= 4. AUDIT ================= */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <span className="text-label uppercase text-ink-muted font-semibold block">Chronological Signed Event Log</span>
          {auditEvents.length === 0 ? (
            <div className="rounded-card border border-border bg-surface p-8 text-center text-small text-ink-secondary">
              No audit events logged yet.
            </div>
          ) : (
            <div className="space-y-2">
              {auditEvents.map((ev) => (
                <AuditEventRow key={ev.id} event={ev} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Privacy Disclosure in Footer (Moved from separate tab) */}
      <div className="pt-8 border-t border-border text-xs text-ink-muted">
        <strong>Privacy disclosure:</strong> Identity, shipment manifests, and raw photos never leave encrypted storage. Only minimal attestation hashes and state verdicts are recorded on NEAR Protocol.
      </div>
    </div>
  );
}

export default function EscrowDetailPage({ params }: { params: { publicId: string } }) {
  return (
    <Suspense fallback={<div className="p-12 text-center font-mono text-small text-ink-muted">Loading escrow...</div>}>
      <EscrowDetailContent params={params} />
    </Suspense>
  );
}
