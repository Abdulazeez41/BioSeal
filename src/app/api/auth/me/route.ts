import { NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";

export async function GET() {
  const user = await AuthService.getCurrentUser();
  return NextResponse.json({ user });
}
