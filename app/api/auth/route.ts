import { NextResponse } from "next/server";

const COOKIE_NAME = "love_auth";

export async function POST(req: Request) {
  try {
    const { password } = (await req.json()) as { password?: string };
    const expected = process.env.LOVE_SITE_PASSWORD || "nini-luka-forever";

    if (!password || password !== expected) {
      return NextResponse.json({ ok: false, error: "invalid password" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, "granted", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid request" }, { status: 400 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0)
  });
  return res;
}
