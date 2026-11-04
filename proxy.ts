import { NextResponse, type NextRequest } from "next/server";
import { unknownLeaguePath } from "./lib/routes.ts";

/**
 * Cache Components sends a 200 shell before notFound() can set the status.
 * Reject unknown team and matchup URLs here so the response is a real 404.
 */
export function proxy(request: NextRequest) {
  if (!unknownLeaguePath(request.nextUrl.pathname)) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/404";
  return NextResponse.rewrite(url, { status: 404 });
}

export const config = {
  matcher: ["/teams/:id", "/teams/:id/:tab", "/matchups/:slug"],
};
