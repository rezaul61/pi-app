"use server";

import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getViewer } from "@/server/session";

export async function createZoneAction(name: string, description = "") {
  const viewer = await getViewer();
  const clean = name.trim().slice(0, 80);
  if (!viewer || clean.length < 3) return { ok: false, message: "A Zone needs a name." };
  const slug = `${clean.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Math.random().toString(36).slice(2, 7)}`;
  const result = await db.execute(sql`INSERT INTO zones (slug, name, description, created_by) VALUES (${slug}, ${clean}, ${description.trim().slice(0, 300)}, ${viewer.id}::uuid) RETURNING id`);
  const id = (result.rows[0] as { id: string }).id;
  await db.execute(sql`INSERT INTO zone_members (zone_id, user_id, role) VALUES (${id}::uuid, ${viewer.id}::uuid, 'owner')`);
  return { ok: true, id, slug };
}
