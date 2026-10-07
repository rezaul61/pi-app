import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { db } from "@/db";
import { sessions, users, type UserRow } from "@/db/schema";
import { and, eq, gt, ne } from "drizzle-orm";

export const SESSION_COOKIE = "pi_session";
const SESSION_DAYS = 7;

export type Viewer = Omit<UserRow, "passHash">;

/* ------------------------------------------------ password hashing (scrypt) */
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  try {
    const [, salt, hash] = stored.split(":");
    const derived = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/* ---------------------------------------------------------- session create */
export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  };
}

export async function createSessionRecord(userId: string, userAgent = "") {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.insert(sessions).values({
    token,
    userId,
    expiresAt,
    userAgent: userAgent.slice(0, 200),
  });
  return { token, expiresAt };
}

export async function createSession(userId: string) {
  const h = await headers();
  const session = await createSessionRecord(userId, h.get("user-agent") ?? "");
  const store = await cookies();
  store.set(SESSION_COOKIE, session.token, sessionCookieOptions(session.expiresAt));
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.token, token));
  store.delete(SESSION_COOKIE);
}

export async function destroyOtherSessions(userId: string, keepToken?: string) {
  if (keepToken) {
    await db
      .delete(sessions)
      .where(and(eq(sessions.userId, userId), sqlNotToken(keepToken)));
  } else {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }
}

function sqlNotToken(token: string) {
  return ne(sessions.token, token);
}

export function currentToken() {
  return cookies().then((c) => c.get(SESSION_COOKIE)?.value ?? null);
}

/* --------------------------------------------------------- viewer resolver */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  if (row.expiresAt.getTime() - Date.now() < (SESSION_DAYS / 2) * 86400000) {
    const next = new Date(Date.now() + SESSION_DAYS * 86400000);
    await db.update(sessions).set({ expiresAt: next }).where(eq(sessions.token, token));
  }

  const { passHash: _omit, ...viewer } = row.user;
  void _omit;
  return viewer;
});
