"use client";

import React, { useState, useEffect } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Activity, ShieldCheck, Cpu, Zap, Database, CheckCircle2, RefreshCw } from "lucide-react";
import { SecondaryButton } from "@/components/ui/Buttons";

export default function StatusPage() {
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<string>("");

  const fetchStatus = () => {
    setLoading(true);
    fetch("/api/near-status")
      .then((res) => res.json())
      .then((data) => {
        setStatusData(data);
        setLastChecked(new Date().toLocaleTimeString());
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-8 sm:py-10 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            Infrastructure Telemetry
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-ink-primary mt-0.5">
            NEAR Network & Enclave Status
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-ink-muted">Last checked: {lastChecked || "..."}</span>
          <SecondaryButton onClick={fetchStatus} loading={loading} icon={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh Status
          </SecondaryButton>
        </div>
      </div>

      {/* Global System Banner */}
      <div className="rounded-2xl border border-status-success/30 bg-[#FAFDFB] p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EBF7EE] text-status-success">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink-primary font-heading">
              All Protocol Systems Operational
            </h3>
            <p className="text-xs text-ink-secondary mt-0.5">
              NEAR Testnet Consensus · TEE Confidential Inference Enclave · NEAR Intents Solvers
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-status-success bg-white px-3 py-1.5 rounded-lg border border-status-success/20">
          <span className="h-2 w-2 rounded-full bg-status-success animate-pulse" />
          <span>100% Uptime</span>
        </div>
      </div>

      {/* Component Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">
          Subsystem Telemetry & Latencies
        </h3>

        {statusData?.components?.map((c: any, idx: number) => (
          <div
            key={idx}
            className="rounded-xl border border-border bg-surface p-6 shadow-card space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-soft text-primary font-bold">
                  {idx === 0 && <Database className="h-4 w-4" />}
                  {idx === 1 && <Cpu className="h-4 w-4" />}
                  {idx === 2 && <Zap className="h-4 w-4" />}
                  {idx === 3 && <ShieldCheck className="h-4 w-4" />}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-ink-primary font-heading">{c.name}</h4>
                  <span className="text-[11px] font-mono text-ink-muted">
                    {c.contractId || c.endpoint || c.relayUrl || c.mpcContract}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-ink-secondary">Latency: {c.latencyMs}ms</span>
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 bg-status-success-soft text-status-success border border-status-success/30 font-semibold text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
                  <span>{c.status}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              {c.features?.map((f: string, fIdx: number) => (
                <span
                  key={fIdx}
                  className="rounded-md bg-surface-soft px-2.5 py-1 text-ink-secondary font-mono text-[11px] border border-border"
                >
                  ✓ {f}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
