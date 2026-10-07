import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";
import { requestUrl } from "@/server/request-origin";
import {
  createSessionRecord,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifyPassword,
} from "@/server/session";
import { LoginSchema } from "@/lib/validations";
import { verifyCsrf } from "@/server/csrf";
import { rateLimit } from "@/server/rate-limit";

export async function POST(req: NextRequest) {
  // 1. CSRF Protection
  if (!verifyCsrf(req)) {
    return new NextResponse("Invalid origin", { status: 403 });
  }

  // 2. Rate Limiting (5 attempts per minute)
  const rl = await rateLimit(5, 60000, "login");
  if (!rl.success) {
    return NextResponse.redirect(requestUrl(req, "/login?error=too_many_requests"), 303);
  }

  const formData = await req.formData();
  const data = Object.fromEntries(formData.entries());

  // 3. Input Validation
  const validated = LoginSchema.safeParse(data);
  if (!validated.success) {
    return NextResponse.redirect(requestUrl(req, "/login?error=invalid_input"), 303);
  }

  const { identifier, password } = validated.data;

  const rows = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${identifier.toLowerCase()} OR lower(${users.username}) = ${identifier.toLowerCase()}`)
    .limit(1);
  const user = rows[0];

  if (!user || !verifyPassword(password, user.passHash)) {
    return NextResponse.redirect(requestUrl(req, "/login?error=credentials"), 303);
  }

  const session = await createSessionRecord(user.id, req.headers.get("user-agent") ?? "");
  const res = NextResponse.redirect(requestUrl(req, user.onboarded ? "/home" : "/onboarding"), 303);
  res.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions(session.expiresAt));
  return res;
}
