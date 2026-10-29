"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Thermometer, ShieldCheck, AlertTriangle, Sparkles, RefreshCw } from "lucide-react";

interface AnimatedChemicalStripProps {
  initialState?: "SAFE" | "VIOLATED";
  interactive?: boolean;
  className?: string;
}

export const AnimatedChemicalStrip: React.FC<AnimatedChemicalStripProps> = ({
  initialState = "SAFE",
  interactive = true,
  className,
}) => {
  const [state, setState] = useState<"SAFE" | "VIOLATED">(initialState);
  const isViolated = state === "VIOLATED";

  const toggleState = () => {
    setState((prev) => (prev === "SAFE" ? "VIOLATED" : "SAFE"));
  };

  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-border bg-surface p-5 sm:p-6 shadow-sm transition-all",
        "relative overflow-hidden select-none",
        className
      )}
    >
      {/* Top Header with Interactive Toggle */}
      <div className="flex items-center justify-between pb-4 border-b border-border text-xs">
        <div className="flex items-center gap-2 font-mono">
          <div
            className={cn(
              "h-2.5 w-2.5 rounded-full",
              isViolated ? "bg-status-critical animate-ping" : "bg-status-success animate-pulse"
            )}
          />
          <span className="font-semibold uppercase tracking-wider text-ink-primary">
            Physical Oracle Indicator
          </span>
          <span className="text-ink-muted">· 3M FreezeWatch / Timestrip</span>
        </div>

        {interactive && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            onClick={toggleState}
            className={cn(
              "px-3 py-1 rounded-pill font-mono text-[11px] font-semibold flex items-center gap-1.5 transition-colors",
              isViolated
                ? "bg-status-critical/10 text-status-critical border border-status-critical/30 hover:bg-status-critical/20"
                : "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"
            )}
          >
            <RefreshCw className="h-3 w-3" />
            <span>{isViolated ? "Simulate Safe Strip" : "Simulate Thermal Excursion"}</span>
          </motion.button>
        )}
      </div>

      {/* Main Chemical Strip Cartoon HUD */}
      <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Left: Animated Physical Cassette */}
        <div className="relative w-full sm:w-72 h-28 bg-[#FAF7F1] rounded-xl border-2 border-border p-3 flex flex-col justify-between shadow-inner">
          {/* Cassette Top Bar */}
          <div className="flex items-center justify-between text-[10px] font-mono text-ink-muted uppercase">
            <span>SN: #BS-4092-CHEM</span>
            <span>Threshold: 8.0°C</span>
          </div>

          {/* Capillary Fluid Tube */}
          <div className="relative h-10 w-full bg-white rounded-lg border-2 border-border overflow-hidden shadow-inner flex items-center">
            {/* Liquid Fill with Elastic Width Spring */}
            <motion.div
              initial={false}
              animate={{
                width: isViolated ? "100%" : "34%",
                backgroundColor: isViolated ? "#E11D48" : "#0F766E",
              }}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 22,
              }}
              className="relative h-full flex items-center justify-end pr-2 overflow-hidden"
            >
              {/* Rising Cartoon Fluid Bubbles */}
              <motion.div
                animate={{ y: [-2, -18, -2], x: [0, 2, -2, 0] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                className="absolute left-3 top-4 h-2 w-2 rounded-full bg-white/40"
              />
              <motion.div
                animate={{ y: [0, -14, 0], x: [0, -3, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, delay: 0.3, ease: "easeInOut" }}
                className="absolute left-8 top-5 h-1.5 w-1.5 rounded-full bg-white/50"
              />
              <motion.div
                animate={{ y: [-1, -16, -1], x: [0, 3, -1, 0] }}
                transition={{ repeat: Infinity, duration: 2.6, delay: 0.7, ease: "easeInOut" }}
                className="absolute left-14 top-4 h-2.5 w-2.5 rounded-full bg-white/35"
              />

              {/* Surface Meniscus Line */}
              <div className="h-full w-1 bg-white/70" />
            </motion.div>

            {/* Threshold Markers */}
            <div className="absolute inset-0 flex justify-between px-3 pointer-events-none text-[9px] font-mono font-semibold text-ink-muted items-center">
              <span>0h</span>
              <span className="text-border-strong">|</span>
              <span className="text-border-strong">|</span>
              <span className="text-status-critical font-bold">EXCURSION</span>
            </div>
          </div>

          {/* Indicator Base Labels */}
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-ink-secondary flex items-center gap-1">
              <Thermometer className="h-3 w-3 text-primary" /> Irreversible dye
            </span>
            <span className={cn("font-semibold", isViolated ? "text-status-critical" : "text-status-success")}>
              {isViolated ? "SEAL BROKEN (100% EXPOSED)" : "SAFE STABLE (< 2.4°C)"}
            </span>
          </div>
        </div>

        {/* Right: Dynamic Machine Interpretation Banner */}
        <div className="flex-1 space-y-2">
          <AnimatePresence mode="wait">
            {isViolated ? (
              <motion.div
                key="violated"
                initial={{ opacity: 0, scale: 0.94, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -6 }}
                transition={{ type: "spring", stiffness: 450, damping: 20 }}
                className="rounded-xl border-2 border-status-critical/30 bg-status-critical/5 p-4 space-y-2"
              >
                <div className="flex items-center gap-2 text-status-critical">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <span className="font-heading font-semibold text-sm">
                    Irreversible Chemical Violet Excursion Detected
                  </span>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed font-sans">
                  The liquid capillary matrix exceeded the 8°C irreversible threshold. NEAR AI TEE enclave classifies result as{" "}
                  <strong className="text-status-critical font-mono">CONDITION_VIOLATED</strong>. Financial policy will automatically route penalty or refund sender.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="safe"
                initial={{ opacity: 0, scale: 0.94, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -6 }}
                transition={{ type: "spring", stiffness: 450, damping: 20 }}
                className="rounded-xl border-2 border-status-success/30 bg-status-success/5 p-4 space-y-2"
              >
                <div className="flex items-center gap-2 text-status-success">
                  <ShieldCheck className="h-5 w-5 shrink-0" />
                  <span className="font-heading font-semibold text-sm">
                    Indicator Intact · Safe Thermal State Verified
                  </span>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed font-sans">
                  Capillary barrier unbroken. Optical density matches baseline condition profile. NEAR AI classifies as{" "}
                  <strong className="text-status-success font-mono">CONDITION_MET</strong>. Escrow payout ready for immediate cryptographic release.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
