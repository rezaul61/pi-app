"use server";

import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { currentToken, destroyOtherSessions, getViewer, hashPassword, verifyPassword } from "@/server/session";

export type SettingsState = { ok?: boolean; error?: string } | null;

function clean(v: FormDataEntryValue | null, max: number) {
  return String(v ?? "").trim().slice(0, max);
}

export async function updateProfileAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Signed out." };

  const name = clean(formData.get("name"), 60);
  const username = clean(formData.get("username"), 20).toLowerCase();
  const headline = clean(formData.get("headline"), 120);
  const bio = clean(formData.get("bio"), 600);
  const location = clean(formData.get("location"), 80);
  const institution = clean(formData.get("institution"), 120);
  const website = clean(formData.get("website"), 200);
  const accent = clean(formData.get("accent"), 20) || "aurora";

  if (name.length < 2) return { error: "Name is too short." };
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return { error: "Invalid username." };

  const taken = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.username}) = ${username} AND ${users.id} <> ${viewer.id}::uuid`)
    .limit(1);
  if (taken.length > 0) return { error: "That username is taken." };

  await db
    .update(users)
    .set({ name, username, headline, bio, location, institution, website, accent })
    .where(eq(users.id, viewer.id));

  revalidatePath(`/u/${username}`);
  revalidatePath("/settings");
  return { ok: true };
}

export async function updatePrefsAction(theme?: string, fx?: string, oppAlerts?: boolean) {
  const viewer = await getViewer();
  if (!viewer) return { ok: false };
  const store = await cookies();
  const patch: { theme?: string; fx?: string } = {};
  if (theme && ["dark", "light"].includes(theme)) {
    patch.theme = theme;
    store.set("pi-theme", theme, { path: "/", maxAge: 31536000 });
  }
  if (fx && ["premium", "balanced", "performance"].includes(fx)) {
    patch.fx = fx;
    store.set("pi-fx", fx, { path: "/", maxAge: 31536000 });
  }
  if (oppAlerts !== undefined) {
    (patch as any).oppAlerts = oppAlerts;
  }
  if (Object.keys(patch).length) {
    await db.update(users).set(patch).where(eq(users.id, viewer.id));
  }
  return { ok: true };
}

export async function changePasswordAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Signed out." };
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");

  const rows = await db.select({ passHash: users.passHash }).from(users).where(eq(users.id, viewer.id)).limit(1);
  if (!rows[0] || !verifyPassword(current, rows[0].passHash))
    return { error: "Current password is incorrect." };
  if (next.length < 8) return { error: "New password must be at least 8 characters." };

  await db.update(users).set({ passHash: hashPassword(next) }).where(eq(users.id, viewer.id));
  const token = await currentToken();
  await destroyOtherSessions(viewer.id, token ?? undefined);
  return { ok: true };
}

export async function revokeOtherSessionsAction() {
  const viewer = await getViewer();
  if (!viewer) return { ok: false };
  const token = await currentToken();
  await destroyOtherSessions(viewer.id, token ?? undefined);
  revalidatePath("/settings");
  return { ok: true };
}

export async function revokeSessionAction(token: string) {
  const viewer = await getViewer();
  const current = await currentToken();
  if (!viewer || token === current || !/^[a-f0-9]{64}$/i.test(token)) return { ok: false };
  await db.delete(sessions).where(sql`${sessions.token} = ${token} AND ${sessions.userId} = ${viewer.id}::uuid`);
  revalidatePath("/settings");
  return { ok: true };
}

export async function updateMediaAction(kind: "avatar" | "cover", url: string) {
  const viewer = await getViewer();
  if (!viewer) return { ok: false };
  if (!url.startsWith("/uploads/")) return { ok: false };
  await db
    .update(users)
    .set(kind === "avatar" ? { avatarUrl: url } : { coverUrl: url })
    .where(eq(users.id, viewer.id));
  revalidatePath(`/u/${viewer.username}`);
  revalidatePath("/settings");
  return { ok: true };
}

export { sessions };
