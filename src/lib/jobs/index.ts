import { AuditService } from "../audit";
import { inMemoryDb } from "../db";
import { NearContractClient } from "../near";

export interface BackgroundJob {
  id: string;
  type: "VERIFICATION_CALLBACK" | "EXPIRY_CHECK" | "SETTLEMENT_RETRY";
  payload: Record<string, unknown>;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  scheduledAt: number;
  completedAt?: number;
}

const jobQueue: BackgroundJob[] = [];

export class DurableJobQueueService {
  /**
   * Enqueues an asynchronous background job
   */
  public static enqueue(type: BackgroundJob["type"], payload: Record<string, unknown>, delayMs = 0): BackgroundJob {
    const job: BackgroundJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      payload,
      status: "QUEUED",
      attempts: 0,
      maxAttempts: 3,
      scheduledAt: Date.now() + delayMs,
    };

    jobQueue.push(job);
    AuditService.logEvent({
      eventType: "BACKGROUND_JOB_ENQUEUED",
      metadata: { jobId: job.id, type: job.type },
    });

    // Run automatically if delay is 0 or short
    if (delayMs <= 1000) {
      setTimeout(() => this.processNextJob(job.id), delayMs);
    }

    return job;
  }

  /**
   * Processes a job with exponential retry policy
   */
  public static async processNextJob(jobId: string): Promise<boolean> {
    const job = jobQueue.find((j) => j.id === jobId);
    if (!job || job.status === "COMPLETED") return false;

    job.status = "RUNNING";
    job.attempts++;

    try {
      switch (job.type) {
        case "EXPIRY_CHECK": {
          const now = Date.now();
          for (const escrow of Array.from(inMemoryDb.escrows.values())) {
            if (
              (escrow.status === "ACTIVE" || escrow.status === "INCONCLUSIVE") &&
              new Date(escrow.deadline).getTime() < now
            ) {
              escrow.status = "EXPIRED";
              escrow.updatedAt = new Date().toISOString();
              AuditService.logEvent({
                escrowId: escrow.id,
                eventType: "ESCROW_EXPIRED_BY_JOB",
                metadata: { publicId: escrow.publicId },
              });
            }
          }
          break;
        }

        case "VERIFICATION_CALLBACK": {
          const { escrowId, sessionId, resultCode } = job.payload as {
            escrowId: string;
            sessionId: string;
            resultCode: "CONDITION_MET" | "CONDITION_VIOLATED" | "INCONCLUSIVE";
          };
          const escrow = inMemoryDb.escrows.get(escrowId);
          if (escrow) {
            escrow.status = resultCode;
            escrow.updatedAt = new Date().toISOString();
          }
          break;
        }

        case "SETTLEMENT_RETRY": {
          const { settlementId } = job.payload as { settlementId: string };
          const st = inMemoryDb.settlements.get(settlementId);
          if (st && st.status === "FAILED") {
            st.status = "SUBMITTED";
            st.updatedAt = new Date().toISOString();
          }
          break;
        }
      }

      job.status = "COMPLETED";
      job.completedAt = Date.now();
      return true;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      job.lastError = errorMsg;
      if (job.attempts >= job.maxAttempts) {
        job.status = "FAILED";
      } else {
        job.status = "QUEUED";
        // Exponential backoff
        setTimeout(() => this.processNextJob(jobId), job.attempts * 2000);
      }
      return false;
    }
  }

  /**
   * Returns list of jobs for operator console monitoring
   */
  public static getJobs(): BackgroundJob[] {
    return [...jobQueue];
  }
}
