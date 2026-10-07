import "server-only";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { blockClause } from "@/server/guards";
import type { Viewer } from "@/server/session";
import { clamp, daysUntil, roleLabel } from "@/lib/utils";
import { pgTextArray } from "./feed";

/* ================================================================ VAULT */
export type VaultItem = {
  id: string;
  kind: string;
  title: string;
  note: string;
  url: string | null;
  postId: string | null;
  tags: string[];
  createdAt: string;
};

export async function listVault(viewer: Viewer): Promise<VaultItem[]> {
  const res = await db.execute(sql`
    SELECT id, kind, title, note, url, post_id, tags, created_at
    FROM vault_items WHERE user_id = ${viewer.id}::uuid
    ORDER BY created_at DESC LIMIT 200
  `);
  return (res.rows as unknown as Array<Record<string, unknown>>).map((r) => ({
    id: r.id as string,
    kind: r.kind as string,
    title: r.title as string,
    note: (r.note as string) ?? "",
    url: (r.url as string) ?? null,
    postId: (r.post_id as string) ?? null,
    tags: (r.tags as string[]) ?? [],
    createdAt: r.created_at as string,
  }));
}

export async function addVaultItem(
  viewer: Viewer,
  input: { kind: string; title: string; note?: string; url?: string; tags?: string[] }
) {
  await db.execute(sql`
    INSERT INTO vault_items (user_id, kind, title, note, url, tags)
    VALUES (${viewer.id}::uuid, ${input.kind}, ${input.title}, ${input.note ?? ""},
            ${input.url ?? null}, ${pgTextArray(input.tags ?? [])}::text[])
  `);
}

export async function removeVaultItem(viewer: Viewer, id: string) {
  await db.execute(sql`DELETE FROM vault_items WHERE id = ${id}::uuid AND user_id = ${viewer.id}::uuid`);
}

/* ========================================================= NOTIFICATIONS */
export type NotificationRow = {
  id: string;
  type: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
  actor: { name: string; username: string; accent: string; avatarUrl: string | null; isVerified: boolean } | null;
};

export async function listNotifications(viewer: Viewer): Promise<NotificationRow[]> {
  const res = await db.execute(sql`
    SELECT n.id, n.type, n.body, n.href, n.read_at, n.created_at, n.actor_id,
           u.name AS actor_name, u.username AS actor_username, u.accent AS actor_accent,
           u.avatar_url AS actor_avatar, u.is_verified AS actor_verified
    FROM notifications n
    LEFT JOIN users u ON u.id = n.actor_id
    WHERE n.user_id = ${viewer.id}::uuid
    ORDER BY n.created_at DESC
    LIMIT 80
  `);
  return (res.rows as unknown as Array<Record<string, unknown>>).map((r) => ({
    id: r.id as string,
    type: r.type as string,
    body: r.body as string,
    href: r.href as string,
    readAt: (r.read_at as string) ?? null,
    createdAt: r.created_at as string,
    actor: r.actor_name
      ? {
          id: r.actor_id as string,
          name: r.actor_name as string,
          username: r.actor_username as string,
          accent: r.actor_accent as string,
          avatarUrl: (r.actor_avatar as string) ?? null,
          isVerified: r.actor_verified as boolean,
        }
      : null,
  }));
}

export async function unreadCount(viewer: Viewer) {
  const res = await db.execute(sql`
    SELECT
      (SELECT count(*) FROM notifications WHERE user_id = ${viewer.id}::uuid AND read_at IS NULL)::int AS notifications,
      (SELECT coalesce(sum(cnt), 0)::int FROM (
        SELECT count(*) AS cnt FROM messages m
        JOIN participants p ON p.conversation_id = m.conversation_id AND p.user_id = ${viewer.id}::uuid
        WHERE m.sender_id <> ${viewer.id}::uuid
          AND (p.last_read_at IS NULL OR m.created_at > p.last_read_at)
      ) t) AS messages,
      (SELECT count(*) FROM connections WHERE addressee_id = ${viewer.id}::uuid AND status = 'pending')::int AS requests
  `);
  const r = res.rows[0] as { notifications: number; messages: number; requests: number };
  return {
    notifications: Number(r.notifications ?? 0),
    messages: Number(r.messages ?? 0),
    requests: Number(r.requests ?? 0),
  };
}

export async function markAllRead(viewer: Viewer) {
  await db.execute(sql`UPDATE notifications SET read_at = now() WHERE user_id = ${viewer.id}::uuid AND read_at IS NULL`);
}

export async function notify(
  userId: string,
  actorId: string | null,
  type: string,
  body: string,
  href: string
) {
  if (userId === actorId) return;
  await db.execute(sql`
    INSERT INTO notifications (user_id, actor_id, type, body, href)
    VALUES (${userId}::uuid, ${actorId}::uuid, ${type}, ${body}, ${href})
  `);
}

/* =========================================================== OPPORTUNITIES */
export type Opportunity = {
  id: string;
  kind: string;
  title: string;
  org: string;
  description: string;
  location: string;
  remote: boolean;
  funding: string;
  deadline: string | null;
  eligibility: string[];
  tags: string[];
  applyUrl: string;
  saved: boolean;
  match: number;
  why: string[];
};

export async function listOpportunities(viewer: Viewer, kind?: string): Promise<Opportunity[]> {
  const kindFilter = kind && kind !== "all" ? sql`AND o.kind = ${kind}` : sql``;
  const res = await db.execute(sql`
    SELECT o.*, EXISTS(SELECT 1 FROM saved_opportunities s
      WHERE s.opportunity_id = o.id AND s.user_id = ${viewer.id}::uuid) AS saved
    FROM opportunities o
    WHERE (o.deadline IS NULL OR o.deadline > now() - interval '30 days')
    ${kindFilter}
    ORDER BY o.deadline ASC NULLS LAST, o.created_at DESC
    LIMIT 60
  `);

  return (res.rows as unknown as Array<Record<string, unknown>>).map((r) => {
    const tags = (r.tags as string[]) ?? [];
    const eligibility = (r.eligibility as string[]) ?? [];
    const matched = tags.filter((t) => viewer.interests.includes(t));
    const roleFit = eligibility.some(
      (e) => e.toLowerCase() === "all backgrounds" || e.toLowerCase().includes(roleLabel(viewer.primaryRole).toLowerCase())
    );
    const titleHit = viewer.interests.some((i) =>
      (r.title as string).toLowerCase().includes(i.split(" ")[0].toLowerCase())
    );

    let score = 42 + matched.length * 13 + (roleFit ? 12 : 0) + (titleHit ? 8 : 0);
    if ((r.remote as boolean) && matched.length > 0) score += 4;
    score = clamp(score, 24, 97);

    const why: string[] = [];
    if (matched.length) why.push(`Aligns with ${matched.slice(0, 2).join(" and ")}`);
    if (titleHit) why.push("Matches a topic in your interest graph");
    if (roleFit) why.push(`Open to ${roleLabel(viewer.primaryRole).toLowerCase()}s`);
    if (r.remote && viewer.location) why.push("Remote-compatible with your location");
    const days = daysUntil(r.deadline as string | null);
    if (days !== null && days <= 30 && days > 0) why.push(`Deadline in ${days} days`);
    if (!why.length) why.push("Broadens your current interest graph");

    return {
      id: r.id as string,
      kind: r.kind as string,
      title: r.title as string,
      org: r.org as string,
      description: (r.description as string) ?? "",
      location: (r.location as string) ?? "",
      remote: r.remote as boolean,
      funding: (r.funding as string) ?? "",
      deadline: (r.deadline as string) ?? null,
      eligibility,
      tags,
      applyUrl: (r.apply_url as string) ?? "",
      saved: r.saved as boolean,
      match: score,
      why,
    };
  });
}

export async function toggleSaveOpportunity(viewer: Viewer, opportunityId: string) {
  const existing = await db.execute(
    sql`SELECT 1 FROM saved_opportunities WHERE user_id = ${viewer.id}::uuid AND opportunity_id = ${opportunityId}::uuid`
  );
  if (existing.rows.length > 0) {
    await db.execute(sql`DELETE FROM saved_opportunities WHERE user_id = ${viewer.id}::uuid AND opportunity_id = ${opportunityId}::uuid`);
    return { saved: false };
  }
  await db.execute(sql`
    INSERT INTO saved_opportunities (user_id, opportunity_id)
    VALUES (${viewer.id}::uuid, ${opportunityId}::uuid) ON CONFLICT DO NOTHING
  `);
  return { saved: true };
}

export async function topOpportunities(viewer: Viewer) {
  const all = await listOpportunities(viewer);
  return all.sort((a, b) => b.match - a.match).slice(0, 3);
}

/* ================================================================ SEARCH */
export type SearchResults = {
  people: Array<{ id: string; name: string; username: string; headline: string; roles: string[]; isVerified: boolean; accent: string; avatarUrl: string | null }>;
  communities: Array<{ id: string; slug: string; name: string; tagline: string; accent: string; members: number }>;
  research: Array<{ id: string; title: string; author: string; username: string; kind: string }>;
  projects: Array<{ id: string; title: string; author: string; username: string; kind: string }>;
  opportunities: Array<{ id: string; title: string; org: string; kind: string }>;
  institutions: Array<{ id: string; name: string; username: string; headline: string; accent: string; avatarUrl: string | null }>;
};

export async function searchAll(viewer: Viewer, q: string): Promise<SearchResults> {
  const like = `%${q.replace(/[%_]/g, "")}%`;
  const empty: SearchResults = { people: [], communities: [], research: [], projects: [], opportunities: [], institutions: [] };
  if (q.trim().length < 2) return empty;

  const [people, communities, research, projects, opportunities, institutions] = await Promise.all([
    db.execute(sql`
      SELECT id, name, username, headline, roles, is_verified, accent, avatar_url
      FROM users u
      WHERE (name ILIKE ${like} OR username ILIKE ${like} OR headline ILIKE ${like})
        AND primary_role <> 'institution'
        ${blockClause(viewer.id, "u.id")}
      LIMIT 5`),
    db.execute(sql`
      SELECT c.id, c.slug, c.name, c.tagline, c.accent,
        (SELECT count(*) FROM community_members m WHERE m.community_id = c.id)::int AS members
      FROM communities c WHERE name ILIKE ${like} OR tagline ILIKE ${like} LIMIT 4`),
    db.execute(sql`
      SELECT p.id, COALESCE(NULLIF(p.title,''), left(p.content, 64)) AS title, u.name AS author, u.username, p.kind
      FROM posts p JOIN users u ON u.id = p.author_id
      WHERE p.kind IN ('research','article') AND (p.title ILIKE ${like} OR p.content ILIKE ${like})
        AND p.visibility = 'public'
        ${blockClause(viewer.id, "p.author_id")}
      ORDER BY p.created_at DESC LIMIT 4`),
    db.execute(sql`
      SELECT p.id, COALESCE(NULLIF(p.title,''), left(p.content, 64)) AS title, u.name AS author, u.username, p.kind
      FROM posts p JOIN users u ON u.id = p.author_id
      WHERE p.kind = 'project' AND (p.title ILIKE ${like} OR p.content ILIKE ${like})
        AND p.visibility = 'public'
        ${blockClause(viewer.id, "p.author_id")}
      ORDER BY p.created_at DESC LIMIT 4`),
    db.execute(sql`
      SELECT id, title, org, kind FROM opportunities
      WHERE title ILIKE ${like} OR org ILIKE ${like} LIMIT 4`),
    db.execute(sql`
      SELECT id, name, username, headline, accent, avatar_url FROM users
      WHERE primary_role = 'institution' AND (name ILIKE ${like} OR headline ILIKE ${like}) LIMIT 3`),
  ]);

  return {
    people: (people.rows as unknown as Array<Record<string, unknown>>).map((r) => ({
      id: r.id as string, name: r.name as string, username: r.username as string,
      headline: (r.headline as string) ?? "", roles: (r.roles as string[]) ?? [],
      isVerified: r.is_verified as boolean, accent: r.accent as string,
      avatarUrl: (r.avatar_url as string) ?? null,
    })),
    communities: (communities.rows as unknown as Array<Record<string, unknown>>).map((r) => ({
      id: r.id as string, slug: r.slug as string, name: r.name as string,
      tagline: (r.tagline as string) ?? "", accent: r.accent as string,
      members: Number(r.members ?? 0),
    })),
    research: (research.rows as unknown as Array<Record<string, unknown>>).map((r) => ({
      id: r.id as string, title: r.title as string, author: r.author as string,
      username: r.username as string, kind: r.kind as string,
    })),
    projects: (projects.rows as unknown as Array<Record<string, unknown>>).map((r) => ({
      id: r.id as string, title: r.title as string, author: r.author as string,
      username: r.username as string, kind: r.kind as string,
    })),
    opportunities: (opportunities.rows as unknown as Array<Record<string, unknown>>).map((r) => ({
      id: r.id as string, title: r.title as string, org: r.org as string, kind: r.kind as string,
    })),
    institutions: (institutions.rows as unknown as Array<Record<string, unknown>>).map((r) => ({
      id: r.id as string, name: r.name as string, username: r.username as string,
      headline: (r.headline as string) ?? "", accent: r.accent as string,
      avatarUrl: (r.avatar_url as string) ?? null,
    })),
  };
}

/* ================================================================ REPORTS */
export async function createReport(
  viewer: Viewer,
  input: { targetType: string; targetId: string; reason: string; detail?: string }
) {
  await db.execute(sql`
    INSERT INTO reports (reporter_id, target_type, target_id, reason, detail)
    VALUES (${viewer.id}::uuid, ${input.targetType}, ${input.targetId}, ${input.reason}, ${input.detail ?? ""})
  `);
}

/* ========================================================== NETWORK STATS */
export async function networkStats(viewer: Viewer) {
  const res = await db.execute(sql`
    SELECT
      (SELECT count(*) FROM connections c WHERE c.status = 'accepted'
        AND (c.requester_id = ${viewer.id}::uuid OR c.addressee_id = ${viewer.id}::uuid))::int AS connections,
      (SELECT count(*) FROM community_members m WHERE m.user_id = ${viewer.id}::uuid)::int AS communities,
      (SELECT count(*) FROM users WHERE primary_role = 'institution')::int AS institutions,
      (SELECT count(*) FROM saved_opportunities s WHERE s.user_id = ${viewer.id}::uuid)::int AS saved_opps
  `);
  const r = res.rows[0] as Record<string, number>;
  return {
    connections: Number(r.connections ?? 0),
    communities: Number(r.communities ?? 0),
    institutions: Number(r.institutions ?? 0),
    savedOpps: Number(r.saved_opps ?? 0),
  };
}
