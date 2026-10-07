"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createSession, destroySession, getViewer, hashPassword, verifyPassword } from "@/server/session";

export type AuthState = { error?: string } | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = clean(formData.get("name")).slice(0, 60);
  const email = clean(formData.get("email")).toLowerCase().slice(0, 120);
  const username = clean(formData.get("username")).toLowerCase().slice(0, 20);
  const password = String(formData.get("password") ?? "");

  if (name.length < 2) return { error: "Please enter your full name." };
  if (!EMAIL_RE.test(email)) return { error: "That email address doesn't look right." };
  if (!USERNAME_RE.test(username))
    return { error: "Username must be 3–20 characters: lowercase letters, numbers, underscores." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${email} OR lower(${users.username}) = ${username}`)
    .limit(1);
  if (existing.length > 0) return { error: "That email or username is already registered." };

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
      return { error: "That email or username is already registered." };
    }

    console.error("Registration insert failed", { code: code ?? "unknown" });
    return { error: "We couldn't create your account right now. Please try again shortly." };
  }

  await createSession(userId);
  redirect("/onboarding");
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const identifier = clean(formData.get("identifier")).toLowerCase().slice(0, 120);
  const password = String(formData.get("password") ?? "");
  if (!identifier || !password) return { error: "Enter your credentials to continue." };

  const rows = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${identifier} OR lower(${users.username}) = ${identifier}`)
    .limit(1);
  const user = rows[0];
  if (!user || !verifyPassword(password, user.passHash))
    return { error: "Incorrect credentials. Try again." };

  await createSession(user.id);
  redirect(user.onboarded ? "/home" : "/onboarding");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export type OnboardingState = { error?: string } | null;

export async function completeOnboardingAction(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const primaryRole = clean(formData.get("role"));
  const interests = formData.getAll("interests").map((v) => String(v)).slice(0, 10);
  const goals = formData.getAll("goals").map((v) => String(v)).slice(0, 7);
  const accent = clean(formData.get("accent")) || "aurora";

  if (!primaryRole) return { error: "Choose the role that fits you best." };
  if (interests.length < 2) return { error: "Pick at least two interests so PI can personalize your home." };
  if (goals.length < 1) return { error: "Tell us at least one thing you want from PI." };

  await db
    .update(users)
    .set({
      primaryRole,
      roles: [primaryRole],
      interests,
      goals,
      accent,
      onboarded: true,
    })
    .where(eq(users.id, viewer.id));

  redirect("/home");
}
