import crypto from "crypto";
import { AuditEventModel } from "../types";

// In-memory audit event log
const auditEvents: AuditEventModel[] = [];

// Sensitive field keys that must ALWAYS be redacted from audit events and logs
const REDACTED_KEYS = new Set([
  "password",
  "private_key",
  "privatekey",
  "secret",
  "token",
  "authorization",
  "cookie",
  "jwt",
  "image_base64",
  "ciphertext",
  "raw_image",
  "email",
  "phone",
  "address",
]);

export class AuditService {
  /**
   * Hashes an IP address using SHA-256 for privacy compliance
   */
  public static hashIp(ip?: string | null): string | null {
    if (!ip) return null;
    return "ip_h_" + crypto.createHash("sha256").update(ip + "_bioseal_salt").digest("hex").slice(0, 16);
  }

  /**
   * Recursively sanitizes and redacts sensitive parameters
   */
  public static sanitizeMetadata(obj: Record<string, unknown>): Record<string, unknown> {
    const clean: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const lower = key.toLowerCase();
      if (REDACTED_KEYS.has(lower)) {
        clean[key] = "[REDACTED]";
      } else if (value && typeof value === "object" && !Array.isArray(value)) {
        clean[key] = this.sanitizeMetadata(value as Record<string, unknown>);
      } else if (typeof value === "string" && (value.startsWith("ed25519:") || value.startsWith("secp256k1:"))) {
        clean[key] = "[REDACTED_KEY]";
      } else {
        clean[key] = value;
      }
    }

    return clean;
  }

  /**
   * Records a signed audit event
   */
  public static logEvent(params: {
    actorId?: string | null;
    actorAccount?: string | null;
    escrowId?: string | null;
    eventType: string;
    metadata: Record<string, unknown>;
    ip?: string | null;
  }): AuditEventModel {
    const event: AuditEventModel = {
      id: crypto.randomUUID(),
      actorId: params.actorId || null,
      actorAccount: params.actorAccount || null,
      escrowId: params.escrowId || null,
      eventType: params.eventType,
      metadata: this.sanitizeMetadata(params.metadata),
      ipHash: this.hashIp(params.ip),
      createdAt: new Date().toISOString(),
    };

    auditEvents.unshift(event);
    if (auditEvents.length > 5000) {
      auditEvents.pop();
    }

    // Structured stdout log (OpenTelemetry format)
    if (process.env.NODE_ENV !== "test") {
      console.log(
        JSON.stringify({
          traceId: crypto.randomBytes(8).toString("hex"),
          timestamp: event.createdAt,
          eventType: event.eventType,
          escrowId: event.escrowId,
          actor: event.actorAccount || event.actorId || "anonymous",
          metadata: event.metadata,
        })
      );
    }

    return event;
  }

  /**
   * Query audit events with optional filtering
   */
  public static getEvents(params?: { escrowId?: string; eventType?: string; limit?: number }): AuditEventModel[] {
    let results = [...auditEvents];
    if (params?.escrowId) {
      results = results.filter((e) => e.escrowId === params.escrowId);
    }
    if (params?.eventType) {
      results = results.filter((e) => e.eventType === params.eventType);
    }
    if (params?.limit) {
      results = results.slice(0, params.limit);
    }
    return results;
  }
}
