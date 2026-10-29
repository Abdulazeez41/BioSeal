import React from "react";
import { cn, formatDate } from "@/lib/utils";
import { AuditEventModel } from "@/lib/types";

interface AuditEventRowProps {
  event: AuditEventModel;
  className?: string;
}

export const AuditEventRow: React.FC<AuditEventRowProps> = ({ event, className }) => {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-surface hover:bg-surface-soft/40 transition-colors text-xs gap-2",
        className
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-primary px-2 py-0.5 rounded bg-primary-light text-[11px]">
            {event.eventType}
          </span>
          <span className="font-mono text-ink-muted text-[11px]">{formatDate(event.createdAt)}</span>
        </div>
        <div className="font-mono text-[11px] text-ink-secondary truncate max-w-xl">
          {JSON.stringify(event.metadata)}
        </div>
      </div>

      <div className="flex items-center gap-3 font-mono text-[11px] text-ink-muted shrink-0">
        {event.actorAccount && <span>Actor: {event.actorAccount}</span>}
        {event.ipHash && <span className="bg-surface-soft px-1.5 py-0.5 rounded border">{event.ipHash}</span>}
      </div>
    </div>
  );
};
