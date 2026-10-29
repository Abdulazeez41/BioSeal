"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { EscrowModel } from "@/lib/types";
import { StatusPill } from "@/components/ui/StatusPill";
import { PrimaryButton } from "@/components/ui/Buttons";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const [escrows, setEscrows] = useState<EscrowModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "NEEDS_ACTION" | "ACTIVE" | "SETTLED">("ALL");

  useEffect(() => {
    fetch("/api/escrows")
      .then((res) => res.json())
      .then((data) => {
        setEscrows(data.escrows || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Filter logic: All, Needs action, Active, Settled
  const filtered = escrows.filter((e) => {
    if (activeFilter === "ACTIVE") return e.status === "ACTIVE";
    if (activeFilter === "SETTLED") return e.status === "SETTLED";
    if (activeFilter === "NEEDS_ACTION") {
      return (
        e.status === "AWAITING_FUNDING" ||
        e.status === "CONDITION_MET" ||
        e.status === "INCONCLUSIVE" ||
        e.status === "CONDITION_VIOLATED"
      );
    }
    return true;
  });

  const getNextAction = (e: EscrowModel): string => {
    switch (e.status) {
      case "AWAITING_FUNDING":
        return "Fund escrow";
      case "ACTIVE":
        return "Scan indicator";
      case "CONDITION_MET":
        return "Release funds";
      case "CONDITION_VIOLATED":
        return "Route by policy";
      case "INCONCLUSIVE":
        return "Rescan indicator";
      case "SETTLED":
        return "Settlement complete";
      case "EXPIRED":
        return "Refund to sender";
      default:
        return "View details";
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-8 sm:py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-h2 font-heading font-semibold text-ink-primary">
            Escrows
          </h1>
          <p className="text-small text-ink-secondary mt-1">
            Condition-based agreements active or settled on NEAR.
          </p>
        </div>

        <Link href="/create">
          <PrimaryButton icon={<Plus className="h-4 w-4" />}>
            Create an escrow
          </PrimaryButton>
        </Link>
      </div>

      {/* Single Filter Row */}
      <div className="flex items-center gap-1 border-b border-border pb-3 text-small">
        {[
          { id: "ALL", label: "All" },
          { id: "NEEDS_ACTION", label: "Needs action" },
          { id: "ACTIVE", label: "Active" },
          { id: "SETTLED", label: "Settled" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id as any)}
            className={`px-3 py-1.5 rounded-pill transition-colors ${
              activeFilter === f.id
                ? "bg-surface-soft text-ink-primary font-medium"
                : "text-ink-secondary hover:text-ink-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* One List */}
      {loading ? (
        <div className="py-20 text-center font-mono text-small text-ink-muted">
          Loading escrows...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-12 text-center space-y-3">
          <p className="text-small text-ink-secondary">No escrows found in this view.</p>
          <Link href="/create">
            <PrimaryButton>Create an escrow</PrimaryButton>
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface divide-y divide-border">
          {filtered.map((e) => {
            const nextAction = getNextAction(e);

            return (
              <Link
                key={e.publicId}
                href={`/escrows/${e.publicId}`}
                className="p-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-soft/40 transition-colors group"
              >
                {/* ID & Title */}
                <div className="space-y-1 sm:w-1/4">
                  <span className="font-mono text-small font-semibold text-ink-primary block">
                    {e.publicId}
                  </span>
                  <span className="text-xs text-ink-secondary truncate block max-w-xs">
                    {e.title}
                  </span>
                </div>

                {/* Amount */}
                <div className="sm:w-1/5">
                  <span className="text-xs text-ink-muted block uppercase">Amount</span>
                  <span className="font-mono text-small font-medium text-ink-primary">
                    {formatCurrency(e.assetAmount, e.assetSymbol)}
                  </span>
                </div>

                {/* Deadline */}
                <div className="sm:w-1/5">
                  <span className="text-xs text-ink-muted block uppercase">Deadline</span>
                  <span className="text-small text-ink-secondary">
                    {formatDate(e.deadline)}
                  </span>
                </div>

                {/* Status Pill */}
                <div className="sm:w-1/6">
                  <StatusPill status={e.status} size="sm" />
                </div>

                {/* One Next Action */}
                <div className="flex items-center justify-between sm:justify-end gap-2 sm:w-1/5 text-small">
                  <span className="text-ink-secondary group-hover:text-ink-primary font-medium">
                    {nextAction}
                  </span>
                  <ArrowRight className="h-4 w-4 text-ink-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
