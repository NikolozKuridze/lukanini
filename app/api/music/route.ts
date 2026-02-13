import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 3600;

const MUSIC_EXT = new Set([".mp3", ".m4a", ".aac", ".ogg", ".wav"]);

export async function GET() {
  try {
    const base = path.join(process.cwd(), "public", "music");
    const items = await fs.readdir(base, { withFileTypes: true });
    const tracks = items
      .filter((x) => x.isFile())
      .map((x) => x.name)
      .filter((name) => MUSIC_EXT.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => `/music/${name}`);

    return NextResponse.json(
      { tracks },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400"
        }
      }
    );
  } catch {
    return NextResponse.json(
      { tracks: [] },
      {
        headers: {
          "Cache-Control": "public, max-age=120, s-maxage=120"
        }
      }
    );
  }
}
