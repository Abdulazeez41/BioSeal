import { describe, it, expect } from "vitest";
import { AuthService } from "@/lib/auth";
import { AuditService } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";

describe("Access Control & Data Minimization", () => {
  it("should create and verify tamper-proof session tokens", () => {
    const user = {
      id: "usr_test_operator",
      nearAccountId: "operator_marcus.near",
      displayName: "Marcus Brody",
      role: "OPERATOR" as const,
      createdAt: new Date().toISOString(),
    };

    const token = AuthService.createSessionToken(user);
    expect(token).toBeDefined();

    const verified = AuthService.verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe(user.id);
    expect(verified?.role).toBe("OPERATOR");
  });

  it("should redact sensitive fields in audit events", () => {
    const metadata = {
      user: "alice",
      token: "secret_bearer_token_xyz",
      private_key: "ed25519:3vYq8471b0293847a91823746a91082348a7b982134098231a4b7c19f0910e28",
      image_base64: "data:image/jpeg;base64,sensitive_pixels...",
      email: "alice@novartis.com",
      status: "CONDITION_MET",
    };

    const sanitized = AuditService.sanitizeMetadata(metadata);
    expect(sanitized.token).toBe("[REDACTED]");
    expect(sanitized.private_key).toBe("[REDACTED]");
    expect(sanitized.image_base64).toBe("[REDACTED]");
    expect(sanitized.email).toBe("[REDACTED]");
    expect(sanitized.status).toBe("CONDITION_MET");
    expect(sanitized.user).toBe("alice");
  });

  it("should enforce rate limiting per IP", () => {
    const testIp = "192.168.1.100";
    // Check first 5 requests allowed
    for (let i = 0; i < 5; i++) {
      const res = checkRateLimit(testIp, 5, 60);
      expect(res.allowed).toBe(true);
    }
    // 6th request blocked
    const blocked = checkRateLimit(testIp, 5, 60);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });
});
