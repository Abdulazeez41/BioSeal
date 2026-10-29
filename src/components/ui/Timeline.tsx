import React from "react";
import { cn, formatDate } from "@/lib/utils";
import { CheckCircle2, Clock, ShieldAlert, Cpu, ArrowUpRight } from "lucide-react";

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  actor?: string | null;
  status?: "SUCCESS" | "WARNING" | "INFO" | "CRITICAL";
  txHash?: string | null;
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ events, className }) => {
  if (!events || events.length === 0) {
    return <div className="text-xs text-ink-muted italic py-4">No lifecycle events recorded yet.</div>;
  }

  return (
    <div className={cn("relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border", className)}>
      {events.map((ev, idx) => {
        const isSuccess = ev.status === "SUCCESS";
        const isCritical = ev.status === "CRITICAL";
        const isWarning = ev.status === "WARNING";

        return (
          <div key={ev.id || idx} className="relative group">
            {/* Dot */}
            <div
              className={cn(
                "absolute -left-6 top-1 h-5 w-5 rounded-full border-2 bg-surface flex items-center justify-center transition-transform group-hover:scale-110",
                isSuccess
                  ? "border-status-success text-status-success"
                  : isCritical
                  ? "border-status-critical text-status-critical"
                  : isWarning
                  ? "border-status-warning text-status-warning"
                  : "border-primary text-primary"
              )}
            >
              <div className="h-2 w-2 rounded-full bg-current" />
            </div>

            <div className="rounded-xl border border-border bg-surface p-4 shadow-sm text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                <h4 className="font-semibold text-ink-primary text-sm font-heading">{ev.title}</h4>
                <span className="font-mono text-ink-muted text-[11px]">{formatDate(ev.timestamp)}</span>
              </div>

              {ev.description && <p className="text-ink-secondary mb-2 leading-relaxed">{ev.description}</p>}

              <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-border/50 text-[11px] text-ink-muted">
                {ev.actor && (
                  <span>
                    Actor: <span className="font-mono text-ink-primary">{ev.actor}</span>
                  </span>
                )}
                {ev.txHash && (
                  <span className="flex items-center gap-1 font-mono text-primary">
                    <span>NEAR Tx: {ev.txHash.slice(0, 10)}...</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
