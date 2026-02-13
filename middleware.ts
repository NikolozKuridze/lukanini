import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "love_auth";
const AUTH_COOKIE_VERSION = process.env.AUTH_COOKIE_VERSION || "v1";
const AUTH_COOKIE_VALUE = `granted:${AUTH_COOKIE_VERSION}`;

function isPublic(pathname: string) {
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname.startsWith("/access-denied")) return true;
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const authValue = req.cookies.get(COOKIE_NAME)?.value;
  const hasAuth = authValue === AUTH_COOKIE_VALUE;

  if (!hasAuth) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "access denied" }, { status: 401 });
    }

    const url = req.nextUrl.clone();
    url.pathname = "/access-denied";
    url.searchParams.set("from", pathname);
    const res = NextResponse.redirect(url);
    if (authValue) {
      res.cookies.set(COOKIE_NAME, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        expires: new Date(0)
      });
    }
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"]
};
