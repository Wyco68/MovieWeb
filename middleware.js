import { NextResponse } from "next/server";
import { applyRateLimit, isBlockedUserAgent, RATE_LIMIT_POLICIES } from "@/lib/rate-limit";

const STATIC_FILE_PATTERN =
  /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|map)$/i;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

function isSearchPath(pathname, searchParams) {
  if (pathname === "/search") return true;
  if (pathname === "/api/tmdb" && searchParams.get("key") === "search_multi_filtered") {
    return true;
  }
  return false;
}

export async function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;
  const userAgent = request.headers.get("user-agent") || "";
  const isApiRoute = pathname.startsWith("/api/");

  if (isBlockedUserAgent(userAgent, { allowApiTools: isApiRoute })) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    return new NextResponse("Forbidden.", { status: 403, headers: { "Content-Type": "text/plain" } });
  }

  if (STATIC_FILE_PATTERN.test(pathname)) {
    return NextResponse.next();
  }

  const isSearch = isSearchPath(pathname, searchParams);
  const policy = isSearch
    ? RATE_LIMIT_POLICIES.TMDB_SEARCH
    : isApiRoute
      ? RATE_LIMIT_POLICIES.TMDB_API
      : RATE_LIMIT_POLICIES.TMDB_PAGE;
  const bucketName = isSearch ? "tmdb-search" : isApiRoute ? "tmdb-api" : "tmdb-page";

  const rateLimit = await applyRateLimit(request, {
    bucketName,
    maxRequests: policy.limit,
    windowMs: policy.windowSeconds * 1000,
  });

  if (!rateLimit.ok) {
    const headers = {
      "Retry-After": String(rateLimit.retryAfterSeconds),
      "Cache-Control": "no-store",
    };

    if (isApiRoute) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429, headers });
    }

    return new NextResponse("Too many requests. Please try again later.", {
      status: 429,
      headers: { ...headers, "Content-Type": "text/plain" },
    });
  }

  return NextResponse.next();
}
