import React from "react";
import { cn } from "@/lib/utils";
import { PrimaryButton, SecondaryButton } from "./Buttons";
import { Inbox, Plus, Scan } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-soft/40 p-12 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface border border-border text-ink-muted mb-4 shadow-sm">
        {icon || <Inbox className="h-6 w-6 text-primary" />}
      </div>
      <h3 className="text-base font-semibold text-ink-primary mb-1">{title}</h3>
      <p className="max-w-md text-xs text-ink-secondary mb-6 leading-relaxed">{description}</p>

      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <PrimaryButton icon={<Plus className="h-4 w-4" />}>{actionLabel}</PrimaryButton>
        </Link>
      )}

      {actionLabel && onAction && !actionHref && (
        <PrimaryButton onClick={onAction} icon={<Plus className="h-4 w-4" />}>
          {actionLabel}
        </PrimaryButton>
      )}
    </div>
  );
};
