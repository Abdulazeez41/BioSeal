"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CameraScanner } from "@/components/verification/CameraScanner";
import { AnimatedChemicalStrip } from "@/components/indicators/AnimatedChemicalStrip";

function VerifyContent() {
  const searchParams = useSearchParams();
  const defaultEscrowId = searchParams.get("escrowId") || "BIO-9402";

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-8 sm:py-10 space-y-8">
      <div>
        <h1 className="text-h2 font-heading font-semibold text-ink-primary">
          Scan & verify
        </h1>
        <p className="text-small text-ink-secondary mt-1">
          Position the physical indicator inside the frame. Verification runs in a private hardware enclave.
        </p>
      </div>

      <CameraScanner escrowPublicId={defaultEscrowId} />

      {/* Interactive Physical Oracle Reference */}
      <div className="pt-4 space-y-3">
        <span className="font-mono text-xs uppercase tracking-wider text-ink-muted block font-semibold">
          Interactive Indicator Reference
        </span>
        <AnimatedChemicalStrip />
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-mono text-small text-ink-muted">Loading camera...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
