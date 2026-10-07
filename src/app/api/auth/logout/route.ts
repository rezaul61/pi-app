import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requestUrl } from "@/server/request-origin";
import { SESSION_COOKIE } from "@/server/session";
import { verifyCsrf } from "@/server/csrf";

export async function POST(req: NextRequest) {
  if (!verifyCsrf(req)) return new NextResponse("Invalid origin", { status: 403 });
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.token, token));

  const res = NextResponse.redirect(requestUrl(req, "/login"), 303);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
