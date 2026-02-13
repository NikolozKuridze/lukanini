import { NextRequest, NextResponse } from "next/server";
import { SURPRISES } from "@/lib/surprises";

export async function GET(req: NextRequest) {
  const level = Number(req.nextUrl.searchParams.get("level") || "1");
  const unlocked = SURPRISES.filter((s) => s.level <= Math.min(Math.max(level, 1), 5));
  return NextResponse.json(unlocked);
}
