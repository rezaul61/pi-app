import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requestUrl } from "@/server/request-origin";
import { getViewer } from "@/server/session";
import { verifyCsrf } from "@/server/csrf";

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function POST(req: NextRequest) {
  if (!verifyCsrf(req)) return new NextResponse("Invalid origin", { status: 403 });
  const viewer = await getViewer();
  if (!viewer) return NextResponse.redirect(requestUrl(req, "/login?error=signed_out"), 303);

  const formData = await req.formData();
  const primaryRole = clean(formData.get("role"));
  const interests = formData.getAll("interests").map((v) => String(v)).slice(0, 10);
  const goals = formData.getAll("goals").map((v) => String(v)).slice(0, 7);
  const accent = clean(formData.get("accent")) || "aurora";

  if (!primaryRole) return NextResponse.redirect(requestUrl(req, "/onboarding?error=role_required"), 303);
  if (interests.length < 2) return NextResponse.redirect(requestUrl(req, "/onboarding?error=interests_required"), 303);
  if (goals.length < 1) return NextResponse.redirect(requestUrl(req, "/onboarding?error=goals_required"), 303);

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

  return NextResponse.redirect(requestUrl(req, "/home"), 303);
}
