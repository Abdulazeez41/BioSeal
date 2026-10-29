import React from "react";
import Link from "next/link";
import { ShieldCheck, ExternalLink } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-surface mt-32">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-16">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10">
          <div className="space-y-3 max-w-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-white">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
              <span className="font-heading text-lg font-semibold tracking-tight text-ink-primary">
                Bio<span className="text-primary font-normal">Seal</span>
              </span>
            </div>
            <p className="text-small text-ink-secondary leading-relaxed">
              Condition-based escrow on NEAR. Irreversible physical indicators classified in hardware enclaves, settled onchain.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-small">
            <div className="space-y-2">
              <span className="text-label uppercase text-ink-muted block font-semibold">Protocol</span>
              <ul className="space-y-1.5 text-ink-secondary">
                <li><Link href="/dashboard" className="hover:text-ink-primary">Dashboard</Link></li>
                <li><Link href="/create" className="hover:text-ink-primary">Create Escrow</Link></li>
                <li><Link href="/verify" className="hover:text-ink-primary">Scan & Verify</Link></li>
                <li><Link href="/status" className="hover:text-ink-primary">NEAR Status</Link></li>
              </ul>
            </div>
            <div className="space-y-2">
              <span className="text-label uppercase text-ink-muted block font-semibold">Resources</span>
              <ul className="space-y-1.5 text-ink-secondary">
                <li><Link href="/docs" className="hover:text-ink-primary">Documentation</Link></li>
                <li><Link href="/privacy" className="hover:text-ink-primary">Privacy Architecture</Link></li>
                <li><a href="https://github.com/nearai/inference-sdk" target="_blank" rel="noreferrer" className="hover:text-ink-primary flex items-center gap-1">NEAR AI SDK <ExternalLink className="h-3 w-3" /></a></li>
              </ul>
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <span className="text-label uppercase text-ink-muted block font-semibold">Network</span>
              <p className="text-ink-secondary font-mono text-xs">
                Contract: bioseal-escrow.testnet<br />
                Consensus: NEAR Protocol
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-ink-muted gap-4">
          <p>© {new Date().getFullYear()} BioSeal. Only the verdict goes onchain.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-ink-primary">Data Minimization</Link>
            <Link href="/docs" className="hover:text-ink-primary">API Reference</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
