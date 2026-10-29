"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const PrimaryButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, loading, icon, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        disabled={disabled || loading}
        whileHover={disabled || loading ? {} : { scale: 1.025, y: -1 }}
        whileTap={disabled || loading ? {} : { scale: 0.94, y: 1 }}
        transition={{ type: "spring", stiffness: 450, damping: 18 }}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-pill bg-primary px-5 py-2.5 text-small font-medium text-white transition-colors duration-150 shadow-sm",
          "hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          "disabled:cursor-not-allowed disabled:opacity-50 select-none",
          className
        )}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        <span>{children}</span>
      </motion.button>
    );
  }
);
PrimaryButton.displayName = "PrimaryButton";

export const SecondaryButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, loading, icon, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        disabled={disabled || loading}
        whileHover={disabled || loading ? {} : { scale: 1.025, y: -1 }}
        whileTap={disabled || loading ? {} : { scale: 0.94, y: 1 }}
        transition={{ type: "spring", stiffness: 450, damping: 18 }}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-pill border border-border bg-surface px-5 py-2.5 text-small font-medium text-ink-primary transition-colors duration-150 shadow-xs",
          "hover:bg-surface-soft hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
          "disabled:cursor-not-allowed disabled:opacity-50 select-none",
          className
        )}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        <span>{children}</span>
      </motion.button>
    );
  }
);
SecondaryButton.displayName = "SecondaryButton";

export const GhostButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, loading, icon, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        disabled={disabled || loading}
        whileHover={disabled || loading ? {} : { scale: 1.03, y: -1 }}
        whileTap={disabled || loading ? {} : { scale: 0.94, y: 1 }}
        transition={{ type: "spring", stiffness: 450, damping: 18 }}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-pill px-4 py-2 text-small font-medium text-ink-secondary transition-colors duration-150",
          "hover:bg-surface-soft hover:text-ink-primary",
          "disabled:cursor-not-allowed disabled:opacity-50 select-none",
          className
        )}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        <span>{children}</span>
      </motion.button>
    );
  }
);
GhostButton.displayName = "GhostButton";
