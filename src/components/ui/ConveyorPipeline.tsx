"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Package, Scan, Cpu, ShieldCheck, Lock, Coins, Sparkles } from "lucide-react";

interface Station {
  id: string;
  name: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STATIONS: Station[] = [
  { id: "indicator", name: "Physical Indicator", detail: "Tamper/temp strip bound by QR", icon: Package },
  { id: "scan", name: "Phone Scan", detail: "Webcam or mobile capture", icon: Scan },
  { id: "ai", name: "Private AI", detail: "Intel SGX2 enclave classification", icon: Cpu },
  { id: "attestation", name: "Attestation", detail: "Hardware PCR0 quote signed", icon: ShieldCheck },
  { id: "escrow", name: "NEAR Contract", detail: "State updated onchain", icon: Lock },
  { id: "settle", name: "Settlement", detail: "Cross-chain payout released", icon: Coins },
];

export const ConveyorPipeline: React.FC = () => {
  const [activeStationIndex, setActiveStationIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStationIndex((prev) => (prev + 1) % STATIONS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="rounded-2xl border-2 border-border bg-surface p-6 sm:p-8 space-y-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
        <div>
          <span className="text-label uppercase tracking-wider text-primary font-semibold block">
            End-to-End Oracle Settlement Loop
          </span>
          <h3 className="font-heading font-semibold text-lg text-ink-primary">
            Continuous Verification Pipeline
          </h3>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs text-ink-muted">
          <span className="h-2 w-2 rounded-full bg-status-success animate-ping" />
          <span>Interactive Conveyor Flow</span>
        </div>
      </div>

      {/* The Conveyor Track */}
      <div className="relative pt-6 pb-2">
        {/* Animated Dashed Rail Track */}
        <div className="absolute top-14 left-6 right-6 h-1 bg-border rounded-full overflow-hidden">
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
            className="w-1/3 h-full bg-primary/40 rounded-full"
          />
        </div>

        {/* Stations Row */}
        <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {STATIONS.map((station, idx) => {
            const Icon = station.icon;
            const isActive = activeStationIndex === idx;
            const isPassed = activeStationIndex > idx;

            return (
              <motion.button
                key={station.id}
                onClick={() => setActiveStationIndex(idx)}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: "spring", stiffness: 450, damping: 18 }}
                className={cn(
                  "relative rounded-xl border-2 p-3 text-left transition-colors flex flex-col items-center sm:items-start text-center sm:text-left z-10",
                  isActive
                    ? "border-primary bg-primary-light/40 shadow-sm"
                    : isPassed
                    ? "border-status-success/30 bg-status-success/5"
                    : "border-border bg-surface hover:border-border-strong"
                )}
              >
                {/* Active Hopping Indicator Parcel on this station */}
                {isActive && (
                  <motion.div
                    layoutId="activeParcel"
                    initial={{ y: -16, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1, rotate: [-3, 3, 0] }}
                    exit={{ y: 12, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 16 }}
                    className="absolute -top-4 right-2 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 flex items-center justify-center h-6 px-2 rounded-full bg-primary text-white text-[10px] font-mono font-bold shadow-md"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    <span>Active</span>
                  </motion.div>
                )}

                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg mb-2 transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : isPassed
                      ? "bg-status-success/15 text-status-success"
                      : "bg-surface-soft text-ink-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="space-y-0.5">
                  <span className="font-heading font-semibold text-xs text-ink-primary block">
                    {station.name}
                  </span>
                  <span className="text-[10px] text-ink-secondary leading-tight hidden sm:block">
                    {station.detail}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Active Stage Callout with Spring Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStationIndex}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 450, damping: 20 }}
          className="rounded-xl border border-primary/20 bg-primary-light/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold uppercase text-primary text-[11px] px-2 py-0.5 rounded-full bg-primary/10">
              Stage {activeStationIndex + 1} of 6
            </span>
            <span className="font-medium text-ink-primary">
              {STATIONS[activeStationIndex].name}: {STATIONS[activeStationIndex].detail}
            </span>
          </div>

          <span className="text-ink-secondary font-mono text-[11px]">
            {activeStationIndex === 0 && "Irreversible chemical reaction bounds to smart contract hash"}
            {activeStationIndex === 1 && "Live challenge nonce anti-replay watermark injected"}
            {activeStationIndex === 2 && "Memory-encrypted Intel SGX2 enclave classifies color channels"}
            {activeStationIndex === 3 && "Cryptographic quote PCR0 recorded onchain without raw pixels"}
            {activeStationIndex === 4 && "NEP-297 event logged; consensus updates agreement state"}
            {activeStationIndex === 5 && "NEAR Intents solver routes USDC / NEAR to intended party"}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
