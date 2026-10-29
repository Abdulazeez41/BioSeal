import { NextRequest, NextResponse } from "next/server";
import { AuditService } from "@/lib/audit";
import { AuthService } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await AuthService.getCurrentUser();
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

  AuditService.logEvent({
    actorId: user.id,
    actorAccount: user.nearAccountId,
    eventType: "USER_LOGGED_OUT",
    metadata: { account: user.nearAccountId },
    ip,
  });

  const response = NextResponse.json({ success: true });
  response.cookies.delete(process.env.SESSION_COOKIE_NAME || "bioseal_session");
  return response;
}
