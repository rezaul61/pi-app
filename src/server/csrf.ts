import { NextRequest } from "next/server";

export function verifyCsrf(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return false;

  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host"))?.split(",")[0]?.trim();
  if (!host) return false;
  try {
    const originUrl = new URL(origin);
    const canonical = process.env.APP_ORIGIN ? new URL(process.env.APP_ORIGIN).host : null;
    return canonical !== null ? originUrl.host === canonical : originUrl.host === host;
  } catch {
    return false;
  }
}
