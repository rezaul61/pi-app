import "server-only";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import type { Viewer } from "@/server/session";
import type { PersonCard } from "./people";

export type CommunityCard = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  accent: string;
  memberCount: number;
  weeklyPosts: number;
  joined: boolean;
  myRole: string | null;
};

function mapCommunity(r: Record<string, unknown>): CommunityCard {
  return {
    id: r.id as string,
    slug: r.slug as string,
    name: r.name as string,
    tagline: (r.tagline as string) ?? "",
    description: (r.description as string) ?? "",
    category: r.category as string,
    accent: r.accent as string,
    memberCount: Number(r.member_count ?? 0),
    weeklyPosts: Number(r.weekly_posts ?? 0),
    joined: r.joined as boolean,
    myRole: (r.my_role as string) ?? null,
  };
}

const COMMUNITY_SELECT = `
  c.id, c.slug, c.name, c.tagline, c.description, c.category, c.accent,
  (SELECT count(*) FROM community_members m WHERE m.community_id = c.id)::int AS member_count,
  (SELECT count(*) FROM posts p WHERE p.community_id = c.id AND p.created_at > now() - interval '7 days')::int AS weekly_posts`;

export async function listCommunities(viewer: Viewer): Promise<CommunityCard[]> {
  const res = await db.execute(sql`
    SELECT ${sql.raw(COMMUNITY_SELECT)},
      EXISTS(SELECT 1 FROM community_members m2 WHERE m2.community_id = c.id AND m2.user_id = ${viewer.id}::uuid) AS joined,
      (SELECT role FROM community_members m3 WHERE m3.community_id = c.id AND m3.user_id = ${viewer.id}::uuid) AS my_role
    FROM communities c
    ORDER BY member_count DESC, c.created_at ASC
  `);
  return (res.rows as unknown as Array<Record<string, unknown>>).map(mapCommunity);
}

export async function getCommunity(viewer: Viewer, slug: string): Promise<CommunityCard | null> {
  const res = await db.execute(sql`
    SELECT ${sql.raw(COMMUNITY_SELECT)},
      EXISTS(SELECT 1 FROM community_members m2 WHERE m2.community_id = c.id AND m2.user_id = ${viewer.id}::uuid) AS joined,
      (SELECT role FROM community_members m3 WHERE m3.community_id = c.id AND m3.user_id = ${viewer.id}::uuid) AS my_role
    FROM communities c WHERE c.slug = ${slug} LIMIT 1
  `);
  const r = res.rows[0];
  return r ? mapCommunity(r) : null;
}

export async function listCommunityMembers(communityId: string): Promise<(PersonCard & { memberRole: string })[]> {
  const res = await db.execute(sql`
    SELECT u.id, u.name, u.username, u.headline, u.roles, u.is_verified, u.accent, u.avatar_url, u.institution, u.location,
           m.role AS member_role
    FROM community_members m
    JOIN users u ON u.id = m.user_id
    WHERE m.community_id = ${communityId}::uuid
    ORDER BY CASE m.role WHEN 'moderator' THEN 0 WHEN 'expert' THEN 1 ELSE 2 END, u.name
    LIMIT 60
  `);
  return (res.rows as unknown as Array<Record<string, unknown>>).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    username: r.username as string,
    headline: (r.headline as string) ?? "",
    roles: (r.roles as string[]) ?? [],
    isVerified: r.is_verified as boolean,
    accent: r.accent as string,
    avatarUrl: (r.avatar_url as string) ?? null,
    institution: (r.institution as string) ?? "",
    location: (r.location as string) ?? "",
    memberRole: r.member_role as string,
  }));
}

export type EventRow = {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  location: string;
  online: boolean;
  communitySlug: string | null;
  communityName: string | null;
};

export async function listEvents(viewer: Viewer, communityId?: string): Promise<EventRow[]> {
  void viewer;
  const filter = communityId ? sql`AND e.community_id = ${communityId}::uuid` : sql``;
  const res = await db.execute(sql`
    SELECT e.id, e.title, e.description, e.starts_at, e.location, e.online,
           c.slug AS community_slug, c.name AS community_name
    FROM events e
    LEFT JOIN communities c ON c.id = e.community_id
    WHERE e.starts_at > now() - interval '1 day' ${filter}
    ORDER BY e.starts_at ASC
    LIMIT 20
  `);
  return (res.rows as unknown as Array<Record<string, unknown>>).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    description: (r.description as string) ?? "",
    startsAt: r.starts_at as string,
    location: (r.location as string) ?? "",
    online: r.online as boolean,
    communitySlug: (r.community_slug as string) ?? null,
    communityName: (r.community_name as string) ?? null,
  }));
}

export async function toggleMembership(viewer: Viewer, communityId: string) {
  const existing = await db.execute(
    sql`SELECT 1 FROM community_members WHERE community_id = ${communityId}::uuid AND user_id = ${viewer.id}::uuid`
  );
  if (existing.rows.length > 0) {
    await db.execute(sql`DELETE FROM community_members WHERE community_id = ${communityId}::uuid AND user_id = ${viewer.id}::uuid`);
    return { joined: false };
  }
  await db.execute(sql`
    INSERT INTO community_members (community_id, user_id, role)
    VALUES (${communityId}::uuid, ${viewer.id}::uuid, 'member')
    ON CONFLICT DO NOTHING
  `);
  return { joined: true };
}
