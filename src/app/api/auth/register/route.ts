import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";
import { requestUrl } from "@/server/request-origin";
import {
  createSessionRecord,
  hashPassword,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/server/session";
import { verifyCsrf } from "@/server/csrf";
import { rateLimit } from "@/server/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function POST(req: NextRequest) {
  if (!verifyCsrf(req)) return new NextResponse("Invalid origin", { status: 403 });
  const rl = await rateLimit(5, 60_000, "register");
  if (!rl.success) return NextResponse.redirect(requestUrl(req, "/register?error=too_many_requests"), 303);
  const formData = await req.formData();
  const name = clean(formData.get("name")).slice(0, 60);
  const email = clean(formData.get("email")).toLowerCase().slice(0, 120);
  const username = clean(formData.get("username")).toLowerCase().slice(0, 20);
  const password = String(formData.get("password") ?? "");

  if (name.length < 2) return NextResponse.redirect(requestUrl(req, "/register?error=invalid_input"), 303);
  if (!EMAIL_RE.test(email)) return NextResponse.redirect(requestUrl(req, "/register?error=invalid_email"), 303);
  if (!USERNAME_RE.test(username)) return NextResponse.redirect(requestUrl(req, "/register?error=invalid_username"), 303);
  if (password.length < 8) return NextResponse.redirect(requestUrl(req, "/register?error=password_short"), 303);

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${email} OR lower(${users.username}) = ${username}`)
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.redirect(requestUrl(req, "/register?error=exists"), 303);
  }

  let userId: string;
  try {
    const inserted = await db
      .insert(users)
      .values({ name, email, username, passHash: hashPassword(password) })
      .returning({ id: users.id });
    userId = inserted[0].id;
  } catch (error) {
    const code =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof error.code === "string"
        ? error.code
        : undefined;

    if (code === "23505") {
      return NextResponse.redirect(requestUrl(req, "/register?error=exists"), 303);
    }

    console.error("Registration insert failed", { code: code ?? "unknown" });
    return NextResponse.redirect(requestUrl(req, "/register?error=registration_failed"), 303);
  }

  const session = await createSessionRecord(userId, req.headers.get("user-agent") ?? "");
  const res = NextResponse.redirect(requestUrl(req, "/onboarding"), 303);
  res.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions(session.expiresAt));
  return res;
}
