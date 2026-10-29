import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthService } from "@/lib/auth";
import { inMemoryDb } from "@/lib/db";
import { AuditService } from "@/lib/audit";
import { UserRole } from "@/lib/types";

const SessionSchema = z.object({
  role: z.enum(["USER", "OPERATOR", "AUDITOR"]).optional(),
  nearAccountId: z.string().optional(),
  displayName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SessionSchema.parse(body);

    const role: UserRole = parsed.role || "USER";
    const user = AuthService.switchPersona(role);

    if (parsed.nearAccountId) {
      user.nearAccountId = parsed.nearAccountId;
    }
    if (parsed.displayName) {
      user.displayName = parsed.displayName;
    }

    const token = AuthService.createSessionToken(user);
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    AuditService.logEvent({
      actorId: user.id,
      actorAccount: user.nearAccountId,
      eventType: "USER_AUTHENTICATED",
      metadata: { role: user.role, account: user.nearAccountId },
      ip,
    });

    const response = NextResponse.json({
      success: true,
      user,
      token,
    });

    response.cookies.set({
      name: process.env.SESSION_COOKIE_NAME || "bioseal_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 3600,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid session request" }, { status: 400 });
  }
}
