import { NextRequest } from "next/server";
import { getRoom, serializeRoom, subscribeRoom } from "@/app/api/room/store";

export const runtime = "nodejs";

function eventPayload(data: unknown) {
  return `event: state\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get("roomId") || "nini-luka-room";

  const stream = new ReadableStream({
    start(controller) {
      const push = (payload: unknown) => {
        controller.enqueue(new TextEncoder().encode(eventPayload(payload)));
      };

      push(serializeRoom(getRoom(roomId)));

      const unsubscribe = subscribeRoom(roomId, (state) => {
        push(serializeRoom(state));
      });

      const keepAlive = setInterval(() => {
        controller.enqueue(new TextEncoder().encode(`event: ping\ndata: {}\n\n`));
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        unsubscribe();
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
