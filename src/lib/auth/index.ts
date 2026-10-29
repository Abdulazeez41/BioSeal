import crypto from "crypto";
import { UserRole, UserSession } from "../types";
import { inMemoryDb } from "../db";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "bioseal-super-secure-production-jwt-secret-key-32chars";
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "bioseal_session";

export class AuthService {
  /**
   * Generates a signed tamper-proof session token
   */
  public static createSessionToken(user: UserSession): string {
    const payload = {
      sub: user.id,
      nearAccountId: user.nearAccountId,
      externalWalletAddress: user.externalWalletAddress,
      displayName: user.displayName,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600, // 7 days
    };

    const headerBase64 = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${headerBase64}.${payloadBase64}`)
      .digest("base64url");

    return `${headerBase64}.${payloadBase64}.${signature}`;
  }

  /**
   * Verifies and decodes a session token
   */
  public static verifySessionToken(token: string): UserSession | null {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const [headerBase64, payloadBase64, signature] = parts;
      const expectedSig = crypto
        .createHmac("sha256", JWT_SECRET)
        .update(`${headerBase64}.${payloadBase64}`)
        .digest("base64url");

      if (signature !== expectedSig) return null;

      const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString());
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }

      return {
        id: payload.sub,
        nearAccountId: payload.nearAccountId,
        externalWalletAddress: payload.externalWalletAddress,
        displayName: payload.displayName,
        role: payload.role as UserRole,
        createdAt: new Date(payload.iat * 1000).toISOString(),
      };
    } catch {
      return null;
    }
  }

  /**
   * Gets current user from Next.js server cookies or fallback to default demonstrator
   */
  public static async getCurrentUser(): Promise<UserSession> {
    try {
      const cookieStore = cookies();
      const token = cookieStore.get(COOKIE_NAME)?.value;
      if (token) {
        const verified = this.verifySessionToken(token);
        if (verified) return verified;
      }
    } catch {
      // Running outside server component or headers context
    }

    // Default to Alice Vance (Novartis Cold-Chain User)
    return (
      inMemoryDb.users.get("usr_alice_101") || {
        id: "usr_alice_101",
        nearAccountId: "alice_biopharma.testnet",
        displayName: "Alice Vance (Novartis Cold-Chain)",
        role: "USER",
        createdAt: new Date().toISOString(),
      }
    );
  }

  /**
   * Switch active user persona for demonstration / audit testing
   */
  public static switchPersona(role: UserRole): UserSession {
    for (const user of Array.from(inMemoryDb.users.values())) {
      if (user.role === role) {
        return user;
      }
    }
    const defaultUser = inMemoryDb.users.get("usr_alice_101")!;
    return defaultUser;
  }
}
