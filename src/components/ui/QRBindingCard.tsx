"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { cn, formatDate } from "@/lib/utils";
import { Copy, Check, Printer, Download, Wifi, ShieldCheck } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "./Buttons";
import { StatusPill } from "./StatusPill";

interface QRBindingCardProps {
  publicId: string;
  indicatorType: string;
  expectedState: string;
  bindingHash: string;
  deadline: string;
  status: string;
  className?: string;
}

export const QRBindingCard: React.FC<QRBindingCardProps> = ({
  publicId,
  indicatorType,
  expectedState,
  bindingHash,
  deadline,
  status,
  className,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const verificationUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/verify?escrowId=${publicId}`
      : `https://bioseal.network/verify?escrowId=${publicId}`;

  useEffect(() => {
    QRCode.toDataURL(
      verificationUrl,
      {
        width: 320,
        margin: 2,
        color: {
          dark: "#161513",
          light: "#FFFFFF",
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [verificationUrl]);

  const copyId = () => {
    navigator.clipboard.writeText(publicId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={cn("rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-card", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            Physical Indicator Binding Record
          </span>
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-2xl font-bold font-mono text-ink-primary">{publicId}</h2>
            <button
              onClick={copyId}
              className="inline-flex items-center gap-1 text-xs text-ink-secondary hover:text-ink-primary transition-colors bg-surface-soft px-2.5 py-1 rounded border border-border"
              title="Copy BioSeal ID"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-status-success" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied" : "Copy ID"}</span>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill status={status} />
          <SecondaryButton onClick={handlePrint} icon={<Printer className="h-4 w-4" />}>
            Print Label
          </SecondaryButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
        {/* Printable Label Box */}
        <div className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-border bg-surface-soft/40 text-center">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt={`QR Verification Code for ${publicId}`}
              className="h-52 w-52 rounded-lg border border-border bg-white p-2 shadow-sm"
            />
          ) : (
            <div className="h-52 w-52 rounded-lg border border-border bg-white flex items-center justify-center">
              <span className="text-xs text-ink-muted">Generating QR...</span>
            </div>
          )}

          <span className="font-mono text-xs font-semibold text-ink-primary mt-3">
            SCAN TO VERIFY PHYSICAL INDICATOR
          </span>
          <span className="text-[11px] font-mono text-ink-muted truncate max-w-xs mt-1">
            {verificationUrl}
          </span>
        </div>

        {/* Binding Details & NFC pairing */}
        <div className="space-y-4 text-xs">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-ink-muted block font-semibold mb-1">
              Indicator Specification
            </span>
            <div className="rounded-lg border border-border bg-surface-soft p-3 text-ink-primary space-y-1">
              <div className="flex justify-between">
                <span className="text-ink-muted">Category:</span>
                <span className="font-semibold">{indicatorType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Expected Baseline:</span>
                <span className="font-medium text-right max-w-xs truncate">{expectedState}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Expiry Deadline:</span>
                <span className="font-medium">{formatDate(deadline)}</span>
              </div>
            </div>
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-wider text-ink-muted block font-semibold mb-1">
              Cryptographic Binding Hash
            </span>
            <div className="rounded-lg border border-border bg-surface-soft p-2.5 font-mono text-[11px] text-ink-secondary break-all">
              {bindingHash}
            </div>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary-light/30 p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-primary font-semibold text-xs">
              <Wifi className="h-4 w-4" />
              <span>NFC Tag Pairing Guide</span>
            </div>
            <p className="text-ink-secondary text-[11px] leading-relaxed">
              To pair an NTAG213/215 NFC indicator chip, write the verification URL as an NDEF URI record.
              The mobile camera flow will automatically read the cryptographic UID.
            </p>
          </div>

          <div className="text-[11px] text-ink-muted flex items-center gap-1.5 pt-1">
            <ShieldCheck className="h-4 w-4 text-status-success shrink-0" />
            <span>Cryptographic binding record recorded permanently on NEAR Protocol.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
