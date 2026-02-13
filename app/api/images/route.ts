import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 0;
export const dynamic = "force-dynamic";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"]);

async function walk(dir: string, baseDir: string, out: string[]) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, baseDir, out);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) continue;
    const rel = path.relative(baseDir, full).split(path.sep).join("/");
    out.push(`/${rel}`);
  }
}

export async function GET() {
  try {
    const baseDir = path.join(process.cwd(), "public");
    const images: string[] = [];
    await walk(baseDir, baseDir, images);
    images.sort((a, b) => a.localeCompare(b));
    return NextResponse.json(
      { images },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate"
        }
      }
    );
  } catch {
    return NextResponse.json(
      { images: [] },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate"
        }
      }
    );
  }
}
