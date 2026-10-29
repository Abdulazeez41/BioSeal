import { NextRequest, NextResponse } from "next/server";
import { AuditService } from "@/lib/audit";
import { AuthService } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await AuthService.getCurrentUser();
  if (user.role !== "OPERATOR" && user.role !== "AUDITOR") {
    return NextResponse.json(
      { error: "Access denied. Operator or Auditor role required." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const escrowId = searchParams.get("escrowId") || undefined;
  const eventType = searchParams.get("eventType") || undefined;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 100;

  const events = AuditService.getEvents({ escrowId, eventType, limit });

  return NextResponse.json({
    events,
    total: events.length,
  });
}
