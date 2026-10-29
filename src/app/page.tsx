"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Hero3DScene } from "@/components/3d/HeroScene";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";
import { ConveyorPipeline } from "@/components/ui/ConveyorPipeline";
import { AnimatedChemicalStrip } from "@/components/indicators/AnimatedChemicalStrip";
import { ArrowRight, Copy, Check } from "lucide-react";

export default function HomePage() {
  const [copied, setCopied] = useState(false);

  const snippet = `const result = await bioseal.verify({
  escrowId: "BIO-9402",
  image: scanBuffer,
});
// { verdict: "CONDITION_MET", confidence: 0.992, proof: "near-ai-tee://quote/..." }`;

  const copySnippet = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-32">
      {/* ================= 1. HERO ================= */}
      <section className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 pt-8 sm:pt-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left ~60% */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-display font-heading text-ink-primary tracking-tight">
              Chemistry is the oracle.
            </h1>

            <p className="text-body text-ink-secondary max-w-2xl leading-relaxed font-sans">
              Lock funds against a physical indicator. Scan it privately. Release money only when the evidence says so.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link href="/create">
                <PrimaryButton icon={<ArrowRight className="h-4 w-4" />}>
                  Create an escrow
                </PrimaryButton>
              </Link>
              <Link href="#how-it-works">
                <SecondaryButton>
                  See how it works
                </SecondaryButton>
              </Link>
            </div>
          </div>

          {/* Right ~40% 3D Scene */}
          <div className="lg:col-span-5">
            <Hero3DScene />
          </div>
        </div>

        {/* Tactile Chemical Indicator Simulation */}
        <div className="pt-12">
          <AnimatedChemicalStrip />
        </div>
      </section>

      {/* ================= 2. HOW IT WORKS ================= */}
      <section id="how-it-works" className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-card border border-border bg-surface p-8 space-y-3">
            <span className="font-mono text-xs text-ink-muted block uppercase font-semibold">01</span>
            <h2 className="text-h3 font-heading font-semibold text-ink-primary">Attach</h2>
            <p className="text-small text-ink-secondary leading-relaxed">
              A tamper or condition indicator is bound to your escrow by QR or NFC.
            </p>
          </div>

          <div className="rounded-card border border-border bg-surface p-8 space-y-3">
            <span className="font-mono text-xs text-ink-muted block uppercase font-semibold">02</span>
            <h2 className="text-h3 font-heading font-semibold text-ink-primary">Scan</h2>
            <p className="text-small text-ink-secondary leading-relaxed">
              A phone photo is classified inside a confidential environment. No one sees the image.
            </p>
          </div>

          <div className="rounded-card border border-border bg-surface p-8 space-y-3">
            <span className="font-mono text-xs text-ink-muted block uppercase font-semibold">03</span>
            <h2 className="text-h3 font-heading font-semibold text-ink-primary">Settle</h2>
            <p className="text-small text-ink-secondary leading-relaxed">
              The policy you set decides who gets paid.
            </p>
          </div>
        </div>

        {/* Animated Tactile Conveyor Pipeline */}
        <div className="pt-2">
          <ConveyorPipeline />
        </div>
      </section>

      {/* ================= 3. PRIVACY TABLE ================= */}
      <section className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 space-y-6">
        <div>
          <h2 className="text-h2 font-heading font-semibold text-ink-primary">
            Only the verdict goes onchain.
          </h2>
          <p className="text-small text-ink-secondary mt-1 max-w-xl">
            Identity and shipment details are never exposed to validators or public explorers.
          </p>
        </div>

        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <table className="w-full text-left text-small">
            <thead className="border-b border-border bg-surface-soft font-mono text-xs uppercase text-ink-secondary">
              <tr>
                <th className="p-4 sm:px-6 font-semibold w-1/2">Onchain</th>
                <th className="p-4 sm:px-6 font-semibold w-1/2">Never leaves encrypted storage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-ink-primary">
              <tr>
                <td className="p-4 sm:px-6 font-medium">Status verdict (Met, Violated, Inconclusive)</td>
                <td className="p-4 sm:px-6 text-ink-secondary">Raw image pixels and captured photos</td>
              </tr>
              <tr>
                <td className="p-4 sm:px-6 font-medium">Hardware attestation quote hash (PCR0)</td>
                <td className="p-4 sm:px-6 text-ink-secondary">Device metadata, IP addresses, and sensor telemetry</td>
              </tr>
              <tr>
                <td className="p-4 sm:px-6 font-medium">Minimal SHA-256 policy hash</td>
                <td className="p-4 sm:px-6 text-ink-secondary">Commercial cargo manifests and pricing agreements</td>
              </tr>
              <tr>
                <td className="p-4 sm:px-6 font-medium">Cryptographic indicator binding reference</td>
                <td className="p-4 sm:px-6 text-ink-secondary">Customer names, email addresses, and phone numbers</td>
              </tr>
              <tr>
                <td className="p-4 sm:px-6 font-medium">Token asset and numeric settlement amount</td>
                <td className="p-4 sm:px-6 text-ink-secondary">Physical street addresses and delivery waybills</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ================= 4. USE CASES ================= */}
      <section className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
        <div className="rounded-card border border-border bg-surface p-6 text-center text-small font-mono text-ink-secondary">
          Pharma · Cold chain · Electronics · Luxury · Industrial · Insurance · Lab samples
        </div>
      </section>

      {/* ================= 5. DEVELOPERS ================= */}
      <section className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center rounded-card border border-border bg-surface p-8 sm:p-10">
          <div className="space-y-4">
            <span className="text-label uppercase tracking-wider text-ink-muted font-semibold block">Developers</span>
            <h2 className="text-h2 font-heading font-semibold text-ink-primary">
              One API call to a verdict.
            </h2>
            <p className="text-small text-ink-secondary leading-relaxed max-w-md">
              Integrate hardware-attested condition verification directly into existing logistics, ERP, or agentic payment pipelines.
            </p>
            <div className="pt-2">
              <Link href="/docs">
                <SecondaryButton icon={<ArrowRight className="h-4 w-4" />}>
                  Read the docs
                </SecondaryButton>
              </Link>
            </div>
          </div>

          <div className="rounded-card border border-border bg-[#161513] text-white p-5 font-mono text-xs overflow-x-auto relative">
            <button
              onClick={copySnippet}
              className="absolute right-3 top-3 p-1.5 rounded-pill bg-white/10 hover:bg-white/20 transition-colors"
              title="Copy snippet"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-status-success" /> : <Copy className="h-3.5 w-3.5 text-white/70" />}
            </button>
            <pre className="text-white/90 leading-relaxed">{snippet}</pre>
          </div>
        </div>
      </section>
    </div>
  );
}
