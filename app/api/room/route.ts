import { NextRequest, NextResponse } from "next/server";
import {
  collectDuoGem,
  getRoom,
  joinRoom,
  leaveRoom,
  nardiMove,
  nardiRoll,
  restartMatch,
  sendSignal,
  serializeRoom,
  syncDuoPlayer,
  type Role
} from "@/app/api/room/store";

export const runtime = "nodejs";

function isRole(v: unknown): v is Role {
  return v === "nini" || v === "luka";
}

function mapError(err: unknown) {
  const msg = err instanceof Error ? err.message : "UNKNOWN";
  if (msg === "ROOM_FULL") return { code: 409, error: "Room is full" };
  if (msg === "ROLE_TAKEN") return { code: 409, error: "Role is already occupied" };
  if (msg === "ROLE_LOCKED") return { code: 409, error: "You already joined as the other role" };
  if (msg === "FORBIDDEN") return { code: 403, error: "Access forbidden" };
  if (msg === "NEED_BOTH") return { code: 409, error: "Both players are required" };
  return { code: 400, error: "Invalid request" };
}

export async function GET(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get("roomId") || "nini-luka-room";
  return NextResponse.json(serializeRoom(getRoom(roomId)));
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      action?:
        | "join"
        | "leave"
        | "duo_state"
        | "duo_collect"
        | "nardi_roll"
        | "nardi_move"
        | "restart"
        | "signal";
      roomId?: string;
      role?: Role;
      clientId?: string;
      toClientId?: string;
      signalType?: "offer" | "answer" | "candidate";
      payload?: unknown;
      gemId?: string;
      from?: number | "bar";
      to?: number | "off";
    };

    const roomId = body.roomId || "nini-luka-room";
    const clientId = (body.clientId || "").trim();

    if (!body.action || !clientId) {
      return NextResponse.json({ error: "action and clientId are required" }, { status: 400 });
    }

    if (body.action === "join") {
      if (!isRole(body.role)) return NextResponse.json({ error: "role is required" }, { status: 400 });
      return NextResponse.json(serializeRoom(joinRoom(roomId, body.role, clientId)));
    }

    if (body.action === "leave") {
      return NextResponse.json(serializeRoom(leaveRoom(roomId, clientId)));
    }

    if (body.action === "duo_state") {
      if (!isRole(body.role)) return NextResponse.json({ error: "role is required" }, { status: 400 });
      return NextResponse.json(
        serializeRoom(syncDuoPlayer(roomId, body.role, clientId, (body.payload as Record<string, unknown>) || {}))
      );
    }

    if (body.action === "duo_collect") {
      if (!isRole(body.role)) return NextResponse.json({ error: "role is required" }, { status: 400 });
      if (!body.gemId) return NextResponse.json({ error: "gemId is required" }, { status: 400 });
      return NextResponse.json(serializeRoom(collectDuoGem(roomId, body.role, clientId, body.gemId)));
    }

    if (body.action === "nardi_roll") {
      if (!isRole(body.role)) return NextResponse.json({ error: "role is required" }, { status: 400 });
      return NextResponse.json(serializeRoom(nardiRoll(roomId, body.role, clientId)));
    }

    if (body.action === "nardi_move") {
      if (!isRole(body.role)) return NextResponse.json({ error: "role is required" }, { status: 400 });
      if (body.from === undefined || body.to === undefined) {
        return NextResponse.json({ error: "from and to are required" }, { status: 400 });
      }
      return NextResponse.json(serializeRoom(nardiMove(roomId, body.role, clientId, body.from, body.to)));
    }

    if (body.action === "restart") {
      if (!isRole(body.role)) return NextResponse.json({ error: "role is required" }, { status: 400 });
      return NextResponse.json(serializeRoom(restartMatch(roomId, body.role, clientId)));
    }

    if (body.action === "signal") {
      if (!isRole(body.role)) return NextResponse.json({ error: "role is required" }, { status: 400 });
      if (!body.toClientId || !body.signalType) {
        return NextResponse.json({ error: "toClientId and signalType are required" }, { status: 400 });
      }

      return NextResponse.json(
        serializeRoom(sendSignal(roomId, body.role, clientId, body.toClientId, body.signalType, body.payload))
      );
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    const mapped = mapError(err);
    return NextResponse.json({ error: mapped.error }, { status: mapped.code });
  }
}
