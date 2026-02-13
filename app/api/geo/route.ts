import { NextRequest, NextResponse } from "next/server";

type PreferredRole = "nini" | "luka" | null;

function countryFromLanguage(req: NextRequest) {
  const lang = (req.headers.get("accept-language") || "").toLowerCase();
  if (lang.includes("ka")) return "GE";
  if (lang.includes("fr")) return "FR";
  return "";
}

function detectCountry(req: NextRequest) {
  const h = req.headers;
  const fromHeader = (
    h.get("x-vercel-ip-country") ||
    h.get("cf-ipcountry") ||
    h.get("x-country-code") ||
    h.get("x-geo-country") ||
    ""
  )
    .trim()
    .toUpperCase();

  if (fromHeader) return fromHeader;
  return countryFromLanguage(req);
}

function roleByCountry(country: string): PreferredRole {
  if (country === "FR") return "nini";
  if (country === "GE") return "luka";
  return null;
}

export async function GET(req: NextRequest) {
  const country = detectCountry(req);
  const preferredRole = roleByCountry(country);
  const welcome =
    preferredRole === "luka"
      ? "მოგესალმები ლუკა"
      : preferredRole === "nini"
        ? "მოგესალმები ნინი"
        : "მოგესალმებით";

  return NextResponse.json({
    country,
    preferredRole,
    welcome
  });
}
