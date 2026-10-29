"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ShieldCheck, Cpu, ArrowRight, Smartphone, Database, Zap, Lock } from "lucide-react";

export const ArchitectureDiagram: React.FC<{ className?: string }> = ({ className }) => {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const steps = [
    {
      id: 1,
      title: "1. Physical Indicator",
      subtitle: "Irreversible Chemistry",
      description:
        "Cold-chain dye, tamper hologram, or biochemical strip permanently shifts state upon threshold breach.",
      icon: <Lock className="h-5 w-5 text-primary" />,
    },
    {
      id: 2,
      title: "2. Edge Phone Scan",
      subtitle: "Encrypted Capture",
      description:
        "Image is captured in browser, SHA-256 hashed, client-side AES-256-GCM encrypted without PII.",
      icon: <Smartphone className="h-5 w-5 text-primary" />,
    },
    {
      id: 3,
      title: "3. NEAR AI TEE",
      subtitle: "Confidential Compute",
      description:
        "Vision model executes inside hardware enclave (Intel SGX / AMD SEV-SNP). Zero identity leakage.",
      icon: <Cpu className="h-5 w-5 text-[#15803D]" />,
    },
    {
      id: 4,
      title: "4. Hardware Attestation",
      subtitle: "Cryptographic Quote",
      description:
        "Enclave produces signed measurement PCR0 and MRSIGNER quote proving untampered execution.",
      icon: <ShieldCheck className="h-5 w-5 text-primary" />,
    },
    {
      id: 5,
      title: "5. NEAR Smart Contract",
      subtitle: "bioseal-escrow",
      description:
        "Minimal state record committed on NEAR Protocol. Verifies enclave attestation signature.",
      icon: <Database className="h-5 w-5 text-primary" />,
    },
    {
      id: 6,
      title: "6. NEAR Intents",
      subtitle: "Cross-Chain Settlement",
      description:
        "Solvers bid to execute atomic funding or destination release across NEAR, Ethereum, Arbitrum, Base.",
      icon: <Zap className="h-5 w-5 text-primary" />,
    },
  ];

  return (
    <div className={cn("rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-card space-y-6", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-2">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            End-to-End System Topology
          </span>
          <h3 className="text-lg font-semibold text-ink-primary font-heading mt-0.5">
            Condition-Based Physical Settlement Flow
          </h3>
        </div>
        <span className="text-xs font-mono text-ink-muted">
          Chemistry → TEE Enclave → NEAR Consensus → Multi-Chain Solver
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {steps.map((step) => {
          const isSelected = activeStep === step.id;
          return (
            <div
              key={step.id}
              onMouseEnter={() => setActiveStep(step.id)}
              onMouseLeave={() => setActiveStep(null)}
              className={cn(
                "rounded-xl border p-5 transition-all cursor-pointer relative",
                isSelected
                  ? "border-primary bg-primary-light/40 shadow-sm translate-y-[-2px]"
                  : "border-border bg-surface-soft/50 hover:border-border-strong hover:bg-surface-soft"
              )}
            >
              <div className="flex items-center gap-3 mb-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface border border-border shadow-xs">
                  {step.icon}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-ink-primary font-heading">{step.title}</h4>
                  <span className="text-[11px] font-mono text-primary">{step.subtitle}</span>
                </div>
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed">{step.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
