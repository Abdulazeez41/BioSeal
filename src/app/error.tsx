"use client";

import { useEffect } from "react";
import { SecondaryButton } from "@/components/ui/Buttons";
import { AlertCircle } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("BioSeal application error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-6">
        <AlertCircle className="w-6 h-6 text-amber-700" />
      </div>
      <span className="text-[12px] font-mono uppercase tracking-wider text-amber-700 mb-2">
        Execution Error
      </span>
      <h1 className="text-3xl font-heading font-semibold text-ink tracking-tight mb-3">
        Failed to load state
      </h1>
      <p className="text-[15px] text-ink-muted max-w-md mb-8">
        An unhandled exception occurred during transaction reconciliation or verification rendering.
      </p>
      <SecondaryButton onClick={() => reset()}>Retry operation</SecondaryButton>
    </div>
  );
}
