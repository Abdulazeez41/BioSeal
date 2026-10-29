"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

interface RubberStampProps {
  verdict: "MET" | "VIOLATED" | "INCONCLUSIVE";
  size?: "sm" | "md" | "lg";
  className?: string;
  triggerConfetti?: boolean;
}

export const RubberStamp: React.FC<RubberStampProps> = ({
  verdict,
  size = "md",
  className,
  triggerConfetti = true,
}) => {
  const isMet = verdict === "MET";
  const isViolated = verdict === "VIOLATED";
  const isInconclusive = verdict === "INCONCLUSIVE";

  useEffect(() => {
    if (isMet && triggerConfetti) {
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.65 },
          colors: ["#0F766E", "#15803D", "#A7F3D0", "#FDE047"],
        });
      } catch {}
    }
  }, [isMet, triggerConfetti]);

  const colorStyles = isMet
    ? "border-[#15803D] text-[#15803D] bg-[#15803D]/5 shadow-[#15803D]/20"
    : isViolated
    ? "border-[#B91C1C] text-[#B91C1C] bg-[#B91C1C]/5 shadow-[#B91C1C]/20"
    : "border-[#B45309] text-[#B45309] bg-[#B45309]/5 shadow-[#B45309]/20";

  const sizeStyles = {
    sm: "px-3 py-1 text-xs tracking-wider border-2",
    md: "px-5 py-2 text-sm sm:text-base tracking-widest border-[3px]",
    lg: "px-7 py-3 text-lg sm:text-xl tracking-widest border-4",
  }[size];

  const tiltAngle = isMet ? -4 : isViolated ? 5 : -2;

  return (
    <div className={cn("relative inline-block select-none", className)}>
      {/* Cartoon Shockwave Impact Ring */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0.8 }}
        animate={{ scale: 1.45, opacity: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className={cn(
          "pointer-events-none absolute inset-0 rounded-xl border-2",
          isMet && "border-[#15803D]",
          isViolated && "border-[#B91C1C]",
          isInconclusive && "border-[#B45309]"
        )}
      />

      {/* The Slamming Rubber Stamp */}
      <motion.div
        initial={{ scale: 2.2, opacity: 0, rotate: tiltAngle - 10 }}
        animate={{ scale: 1, opacity: 1, rotate: tiltAngle }}
        transition={{
          type: "spring",
          stiffness: 420,
          damping: 17,
          mass: 0.8,
        }}
        whileHover={{
          scale: 1.05,
          rotate: tiltAngle + 1,
          transition: { type: "spring", stiffness: 300, damping: 10 },
        }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative uppercase font-mono font-black rounded-lg text-center cursor-default",
          "border-dashed shadow-md backdrop-blur-xs",
          colorStyles,
          sizeStyles
        )}
      >
        {/* Double-border inside effect like authentic physical rubber seal */}
        <div className="absolute inset-0.5 rounded-[4px] border border-current opacity-40 pointer-events-none" />

        <div className="flex items-center justify-center gap-2">
          <span>●</span>
          <span>
            {isMet && "CONDITION MET"}
            {isViolated && "SEAL BREACHED"}
            {isInconclusive && "INCONCLUSIVE"}
          </span>
          <span>●</span>
        </div>
      </motion.div>
    </div>
  );
};
