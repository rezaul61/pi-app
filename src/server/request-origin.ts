import type { NextRequest } from "next/server";

/* Resolve the public origin behind preview/reverse proxies.
   Priority: browser Origin header -> forwarded host/proto -> request URL origin. */
export function requestOrigin(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  if (host) return `${proto}://${host}`;

  return req.nextUrl.origin;
}

export function requestUrl(req: NextRequest, path: string) {
  return new URL(path, requestOrigin(req));
}
