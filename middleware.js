import { NextResponse } from "next/server";
import { getClientIp, isIpBanned } from "@/lib/rate-limit";

export const config = {
  matcher: "/api/:path*",
};

export async function middleware(request) {
  const userAgent = request.headers.get("user-agent") || "";
  if (!userAgent.trim()) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const ip = getClientIp(request);

  if (await isIpBanned(ip)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return NextResponse.next();
}
