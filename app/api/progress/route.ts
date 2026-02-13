import { NextRequest, NextResponse } from "next/server";
import { getProgress, saveProgress } from "@/app/api/progress/store";
import type { CoupleProgress, GameKey, PlayerStats } from "@/lib/types";

function defaultGameStats(): Record<GameKey, number> {
  return { heartBurst: 0, syncTap: 0, loveQuiz: 0 };
}

function defaultLeaderboard(nini: string, luka: string): [PlayerStats, PlayerStats] {
  return [
    { name: nini, points: 0, wins: 0 },
    { name: luka, points: 0, wins: 0 }
  ];
}

function toInt(v: unknown, fallback = 0) {
  if (typeof v !== "number" || Number.isNaN(v)) return fallback;
  return Math.floor(v);
}

function sanitizeProgress(payload: Partial<CoupleProgress> & { id: string }): CoupleProgress {
  const nini = (payload.nini || "Nini").trim() || "Nini";
  const luka = (payload.luka || "Luka").trim() || "Luka";

  const rawBoard = Array.isArray(payload.leaderboard) ? payload.leaderboard : [];
  const first = rawBoard[0];
  const second = rawBoard[1];

  const leaderboard: [PlayerStats, PlayerStats] = [
    {
      name: (first?.name || nini).trim() || nini,
      points: Math.max(toInt(first?.points), 0),
      wins: Math.max(toInt(first?.wins), 0)
    },
    {
      name: (second?.name || luka).trim() || luka,
      points: Math.max(toInt(second?.points), 0),
      wins: Math.max(toInt(second?.wins), 0)
    }
  ];

  const gameStats: Record<GameKey, number> = {
    heartBurst: Math.max(toInt(payload.gameStats?.heartBurst), 0),
    syncTap: Math.max(toInt(payload.gameStats?.syncTap), 0),
    loveQuiz: Math.max(toInt(payload.gameStats?.loveQuiz), 0)
  };

  return {
    id: payload.id,
    nini,
    luka,
    level: Math.min(Math.max(toInt(payload.level, 1), 1), 5),
    points: Math.max(toInt(payload.points), 0),
    unlockedSurprises: Array.isArray(payload.unlockedSurprises)
      ? payload.unlockedSurprises.filter((v) => Number.isInteger(v) && v >= 1 && v <= 5)
      : [1],
    leaderboard,
    gameStats,
    updatedAt: new Date().toISOString()
  };
}

function defaultProgress(id: string): CoupleProgress {
  return {
    id,
    nini: "Nini",
    luka: "Luka",
    level: 1,
    points: 0,
    unlockedSurprises: [1],
    leaderboard: defaultLeaderboard("Nini", "Luka"),
    gameStats: defaultGameStats(),
    updatedAt: new Date().toISOString()
  };
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "nini-luka";
  const existing = getProgress(id) ?? defaultProgress(id);
  return NextResponse.json(sanitizeProgress(existing));
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as Partial<CoupleProgress>;
    if (!payload?.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const sanitized = sanitizeProgress(payload as Partial<CoupleProgress> & { id: string });
    saveProgress(sanitized);
    return NextResponse.json(sanitized);
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
}
