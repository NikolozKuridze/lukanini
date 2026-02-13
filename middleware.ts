import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "love_auth";

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

  const hasAuth = req.cookies.get(COOKIE_NAME)?.value === "granted";

  if (!hasAuth) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "access denied" }, { status: 401 });
    }

    const url = req.nextUrl.clone();
    url.pathname = "/access-denied";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"]
};
