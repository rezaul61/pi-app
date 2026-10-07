import "server-only";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { blockClause, visibilityClause, ownsPost } from "@/server/guards";
import type { Viewer } from "@/server/session";

/* Shared feed row shape (mapped from SQL) */
export type FeedPost = {
  id: string;
  kind: string;
  title: string;
  content: string;
  mediaUrl: string | null;
  visibility: string;
  tags: string[];
  repostedFromId: string | null;
  repostedAuthor: { name: string; username: string } | null;
  taggedUsers: Array<{ id: string; name: string; username: string; avatarUrl: string | null; roles: string[] }>;
  meta: Record<string, unknown>;
  createdAt: string;
  reactionCount: number;
  commentCount: number;
  myReaction: string | null;
  saved: boolean;
  pollCounts: Array<{ i: number; n: number }>;
  pollTotal: number;
  myVote: number | null;
  author: {
    id: string;
    name: string;
    username: string;
    headline: string;
    roles: string[];
    isVerified: boolean;
    accent: string;
    avatarUrl: string | null;
  };
  community: { slug: string; name: string } | null;
};

function mapFeedRow(r: any): FeedPost {
  return {
    id: r.id, kind: r.kind, title: r.title, content: r.content,
    mediaUrl: r.media_url, visibility: r.visibility, tags: r.tags ?? [],
    repostedFromId: r.reposted_from_id ?? null,
    repostedAuthor: r.repost_author_name ? { name: r.repost_author_name, username: r.repost_author_username } : null,
    taggedUsers: r.tagged_users ?? [],
    meta: r.meta ?? {}, createdAt: r.created_at,
    reactionCount: Number(r.reaction_count ?? 0),
    commentCount: Number(r.comment_count ?? 0),
    myReaction: r.my_reaction, saved: r.saved,
    pollCounts: r.poll_counts ?? [],
    pollTotal: Number(r.poll_total ?? 0),
    myVote: r.my_vote,
    author: {
      id: r.author_id, name: r.name, username: r.username,
      headline: r.headline, roles: r.roles ?? [], isVerified: r.is_verified,
      accent: r.accent, avatarUrl: r.avatar_url,
    },
    community: r.community_slug
      ? { slug: r.community_slug, name: r.community_name ?? "" }
      : null,
  };
}

export async function listFeed(
  viewer: Viewer,
  opts: { communityId?: string; authorId?: string; kind?: string; limit?: number } = {}
): Promise<FeedPost[]> {
  const communityFilter = opts.communityId
    ? sql`AND p.community_id = ${opts.communityId}::uuid`
    : sql``;
  const authorFilter = opts.authorId ? sql`AND p.author_id = ${opts.authorId}::uuid` : sql``;
  const kindFilter = opts.kind ? sql`AND p.kind = ${opts.kind}` : sql``;
  const limit = opts.limit ?? 30;

  const res = await db.execute(sql`
    SELECT p.id, p.kind, p.title, p.content, p.media_url, p.visibility, p.tags, p.meta,
           p.created_at, p.reposted_from_id,
           (SELECT count(*) FROM reactions r WHERE r.post_id = p.id)::int AS reaction_count,
           (SELECT count(*) FROM comments cm WHERE cm.post_id = p.id)::int AS comment_count,
           (SELECT r2.type FROM reactions r2 WHERE r2.post_id = p.id AND r2.user_id = ${viewer.id}::uuid LIMIT 1) AS my_reaction,
           EXISTS(SELECT 1 FROM vault_items v WHERE v.post_id = p.id AND v.user_id = ${viewer.id}::uuid) AS saved,
           (SELECT coalesce(json_agg(t ORDER BY t.i), '[]'::json) FROM
              (SELECT option_index AS i, count(*)::int AS n FROM poll_votes pv WHERE pv.post_id = p.id GROUP BY option_index) t
           ) AS poll_counts,
           (SELECT count(*) FROM poll_votes pv3 WHERE pv3.post_id = p.id)::int AS poll_total,
           (SELECT option_index FROM poll_votes pv2 WHERE pv2.post_id = p.id AND pv2.user_id = ${viewer.id}::uuid LIMIT 1) AS my_vote,
           u.id AS author_id, u.name, u.username, u.headline, u.roles, u.is_verified,
           u.accent, u.avatar_url,
           c.slug AS community_slug, c.name AS community_name,
           ru.name AS repost_author_name, ru.username AS repost_author_username,
           (SELECT coalesce(json_agg(tu), '[]'::json) FROM (
             SELECT tu_u.id, tu_u.name, tu_u.username, tu_u.avatar_url, tu_u.roles 
             FROM unnest(p.tagged_user_ids) tid 
             JOIN users tu_u ON tu_u.id = tid
           ) tu) AS tagged_users
    FROM posts p
    JOIN users u ON u.id = p.author_id
    LEFT JOIN communities c ON c.id = p.community_id
    LEFT JOIN posts rp ON rp.id = p.reposted_from_id
    LEFT JOIN users ru ON ru.id = rp.author_id
    WHERE 1=1
      ${visibilityClause(viewer.id)}
      ${blockClause(viewer.id, "p.author_id")}
      ${communityFilter}
      ${authorFilter}
      ${kindFilter}
    ORDER BY p.created_at DESC
    LIMIT ${limit}
  `);
  return (res.rows as any[]).map(mapFeedRow);
}

export async function getPost(viewer: Viewer, id: string): Promise<FeedPost | null> {
  const res = await db.execute(sql`
    SELECT p.id, p.kind, p.title, p.content, p.media_url, p.visibility, p.tags, p.meta,
           p.created_at, p.reposted_from_id,
           (SELECT count(*) FROM reactions r WHERE r.post_id = p.id)::int AS reaction_count,
           (SELECT count(*) FROM comments cm WHERE cm.post_id = p.id)::int AS comment_count,
           (SELECT r2.type FROM reactions r2 WHERE r2.post_id = p.id AND r2.user_id = ${viewer.id}::uuid LIMIT 1) AS my_reaction,
           EXISTS(SELECT 1 FROM vault_items v WHERE v.post_id = p.id AND v.user_id = ${viewer.id}::uuid) AS saved,
           (SELECT coalesce(json_agg(t ORDER BY t.i), '[]'::json) FROM
              (SELECT option_index AS i, count(*)::int AS n FROM poll_votes pv WHERE pv.post_id = p.id GROUP BY option_index) t
           ) AS poll_counts,
           (SELECT count(*) FROM poll_votes pv3 WHERE pv3.post_id = p.id)::int AS poll_total,
           (SELECT option_index FROM poll_votes pv2 WHERE pv2.post_id = p.id AND pv2.user_id = ${viewer.id}::uuid LIMIT 1) AS my_vote,
           u.id AS author_id, u.name, u.username, u.headline, u.roles, u.is_verified,
           u.accent, u.avatar_url,
           c.slug AS community_slug, c.name AS community_name,
           ru.name AS repost_author_name, ru.username AS repost_author_username,
           (SELECT coalesce(json_agg(tu), '[]'::json) FROM (
             SELECT tu_u.id, tu_u.name, tu_u.username, tu_u.avatar_url, tu_u.roles 
             FROM unnest(p.tagged_user_ids) tid 
             JOIN users tu_u ON tu_u.id = tid
           ) tu) AS tagged_users
    FROM posts p
    JOIN users u ON u.id = p.author_id
    LEFT JOIN communities c ON c.id = p.community_id
    LEFT JOIN posts rp ON rp.id = p.reposted_from_id
    LEFT JOIN users ru ON ru.id = rp.author_id
    WHERE p.id = ${id}::uuid
      ${visibilityClause(viewer.id)}
      ${blockClause(viewer.id, "p.author_id")}
    LIMIT 1
  `);
  const r = res.rows[0] as any;
  if (!r) return null;
  return mapFeedRow(r);
}

export type CommentRow = {
  id: string;
  parentId: string | null;
  content: string;
  categoryCounts: Record<string, number>;
  createdAt: string;
  author: {
    id: string; name: string; username: string;
    roles: string[]; isVerified: boolean; accent: string; avatarUrl: string | null;
  };
};

export async function getComments(viewer: Viewer, postId: string): Promise<CommentRow[]> {
  const res = await db.execute(sql`
    SELECT cm.id, cm.parent_id, cm.content, cm.category_counts, cm.created_at,
           u.id AS author_id, u.name, u.username, u.roles, u.is_verified, u.accent, u.avatar_url
    FROM comments cm
    JOIN users u ON u.id = cm.author_id
    WHERE cm.post_id = ${postId}::uuid
      ${blockClause(viewer.id, "cm.author_id")}
    ORDER BY cm.created_at ASC
    LIMIT 120
  `);
  return (res.rows as unknown as Array<Record<string, unknown>>).map((r) => ({
    id: r.id as string,
    parentId: (r.parent_id as string) || null,
    content: r.content as string,
    categoryCounts: (r.category_counts as Record<string, number>) || {},
    createdAt: r.created_at as string,
    author: {
      id: r.author_id as string,
      name: r.name as string,
      username: r.username as string,
      roles: (r.roles as string[]) ?? [],
      isVerified: r.is_verified as boolean,
      accent: r.accent as string,
      avatarUrl: (r.avatar_url as string) ?? null,
    },
  }));
}

/* Build a Postgres text[] literal safely (drizzle spreads JS arrays into params) */
export function pgTextArray(arr: string[]) {
  return "{" + arr.map((s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",") + "}";
}

export async function createPost(
  viewer: Viewer,
  input: {
    kind: string; title?: string; content: string; mediaUrl?: string;
    visibility?: string; tags?: string[]; communityId?: string;
    meta?: Record<string, unknown>;
  }
): Promise<string> {
  const res = await db.execute(sql`
    INSERT INTO posts (author_id, community_id, kind, title, content, media_url, visibility, tags, meta)
    VALUES (${viewer.id}::uuid,
            ${input.communityId ?? null}::uuid,
            ${input.kind},
            ${input.title ?? ""},
            ${input.content},
            ${input.mediaUrl ?? null},
            ${input.visibility ?? "public"},
            ${pgTextArray(input.tags ?? [])}::text[],
            ${JSON.stringify(input.meta ?? {})}::jsonb)
    RETURNING id
  `);
  return (res.rows[0] as { id: string }).id;
}

export async function createEvent(
  viewer: Viewer,
  input: { communityId?: string | null; title: string; description: string; startsAt: string; location: string; online: boolean }
) {
  await db.execute(sql`
    INSERT INTO events (community_id, title, description, starts_at, location, online, created_by)
    VALUES (${input.communityId ?? null}::uuid, ${input.title}, ${input.description},
            ${input.startsAt}::timestamptz, ${input.location}, ${input.online}, ${viewer.id}::uuid)
  `);
}

export async function addCommentNotify(viewer: Viewer, postId: string) {
  const author = await db.execute(
    sql`SELECT author_id FROM posts WHERE id = ${postId}::uuid LIMIT 1`
  );
  const authorId = (author.rows[0] as { author_id: string } | undefined)?.author_id;
  if (!authorId || authorId === viewer.id) return;
  const { notify } = await import("./misc");
  await notify(
    authorId,
    viewer.id,
    "comment",
    `${viewer.name} commented on your post.`,
    `/post/${postId}`
  );
}

export async function deletePost(viewer: Viewer, postId: string) {
  if (!(await ownsPost(postId, viewer.id))) return false;
  await db.execute(sql`DELETE FROM posts WHERE id = ${postId}::uuid`);
  return true;
}

export async function toggleReaction(viewer: Viewer, postId: string, type: string) {
  const existing = await db.execute(
    sql`SELECT type FROM reactions WHERE post_id = ${postId}::uuid AND user_id = ${viewer.id}::uuid`
  );
  if (existing.rows.length > 0) {
    await db.execute(sql`DELETE FROM reactions WHERE post_id = ${postId}::uuid AND user_id = ${viewer.id}::uuid`);
    return { active: false };
  }
  await db.execute(sql`
    INSERT INTO reactions (post_id, user_id, type) VALUES (${postId}::uuid, ${viewer.id}::uuid, ${type})
    ON CONFLICT (post_id, user_id) DO NOTHING
  `);
  return { active: true };
}

export async function votePoll(viewer: Viewer, postId: string, optionIndex: number) {
  await db.execute(sql`
    INSERT INTO poll_votes (post_id, user_id, option_index)
    VALUES (${postId}::uuid, ${viewer.id}::uuid, ${optionIndex})
    ON CONFLICT (post_id, user_id) DO NOTHING
  `);
}

export async function toggleSavePost(viewer: Viewer, postId: string, title: string) {
  const existing = await db.execute(
    sql`SELECT id FROM vault_items WHERE post_id = ${postId}::uuid AND user_id = ${viewer.id}::uuid`
  );
  if (existing.rows.length > 0) {
    await db.execute(sql`DELETE FROM vault_items WHERE post_id = ${postId}::uuid AND user_id = ${viewer.id}::uuid`);
    return { saved: false };
  }
  await db.execute(sql`
    INSERT INTO vault_items (user_id, kind, title, post_id)
    VALUES (${viewer.id}::uuid, 'post', ${title.slice(0, 90)}, ${postId}::uuid)
  `);
  return { saved: true };
}
