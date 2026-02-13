import { NextRequest, NextResponse } from "next/server";
import { getProgress, listProgress } from "@/app/api/progress/store";
import type { LeaderboardResponse } from "@/lib/types";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (id) {
    const item = getProgress(id);
    if (!item) {
      return NextResponse.json({ error: "couple not found" }, { status: 404 });
    }

    const ranking = [...item.leaderboard].sort((a, b) => b.points - a.points || b.wins - a.wins);
    const out: LeaderboardResponse = {
      coupleId: item.id,
      ranking,
      totalPoints: item.points,
      updatedAt: item.updatedAt
    };

    return NextResponse.json(out);
  }

  const all = listProgress().map((item) => ({
    coupleId: item.id,
    ranking: [...item.leaderboard].sort((a, b) => b.points - a.points || b.wins - a.wins),
    totalPoints: item.points,
    updatedAt: item.updatedAt
  }));

  return NextResponse.json(all);
}
