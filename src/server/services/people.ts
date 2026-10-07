import "server-only";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import type { Viewer } from "@/server/session";

export type PersonCard = {
  id: string;
  name: string;
  username: string;
  headline: string;
  roles: string[];
  isVerified: boolean;
  accent: string;
  avatarUrl: string | null;
  institution: string;
  location: string;
  shared?: number;
};

type RawPerson = {
  id: string; name: string; username: string; headline: string; roles: string[];
  is_verified: boolean; accent: string; avatar_url: string | null;
  institution: string; location: string; shared?: number;
};

function mapPerson(r: RawPerson): PersonCard {
  return {
    id: r.id, name: r.name, username: r.username, headline: r.headline,
    roles: r.roles ?? [], isVerified: r.is_verified, accent: r.accent,
    avatarUrl: r.avatar_url, institution: r.institution ?? "", location: r.location ?? "",
    shared: r.shared !== undefined ? Number(r.shared) : undefined,
  };
}

export type Profile = PersonCard & {
  bio: string;
  location: string;
  website: string;
  interests: string[];
  joinedAt: string;
  postCount: number;
  connectionCount: number;
  followerCount: number;
  isFollowing: boolean;
  viewCount: number;
  relation: "self" | "connected" | "incoming" | "outgoing" | "none";
};

export async function getProfile(viewer: Viewer, username: string): Promise<Profile | null> {
  const res = await db.execute(sql`
    SELECT u.id, u.name, u.username, u.headline, u.bio, u.location, u.website, u.interests,
           u.roles, u.is_verified, u.accent, u.avatar_url, u.institution, u.created_at,
           (SELECT count(*) FROM posts p WHERE p.author_id = u.id)::int AS post_count,
           (SELECT count(*) FROM connections c WHERE c.status = 'accepted'
             AND (c.requester_id = u.id OR c.addressee_id = u.id))::int AS connection_count,
           (SELECT count(*) FROM follows f WHERE f.following_id = u.id)::int AS follower_count,
           (SELECT count(DISTINCT viewer_id) FROM profile_views WHERE viewed_id = u.id AND viewer_id <> u.id)::int AS view_count,
           EXISTS(SELECT 1 FROM follows f2 WHERE f2.follower_id = ${viewer.id}::uuid AND f2.following_id = u.id) AS is_following,
           (SELECT c2.status FROM connections c2
             WHERE (c2.requester_id = ${viewer.id}::uuid AND c2.addressee_id = u.id)
                OR (c2.addressee_id = ${viewer.id}::uuid AND c2.requester_id = u.id) LIMIT 1) AS conn_status,
           (SELECT c3.requester_id FROM connections c3
             WHERE (c3.requester_id = ${viewer.id}::uuid AND c3.addressee_id = u.id)
                OR (c3.addressee_id = ${viewer.id}::uuid AND c3.requester_id = u.id) LIMIT 1) AS conn_requester
    FROM users u
    WHERE lower(u.username) = lower(${username})
    LIMIT 1
  `);
  const r = res.rows[0] as Record<string, unknown> | undefined;
  if (!r) return null;

  let relation: Profile["relation"] = "none";
  if (r.id === viewer.id) relation = "self";
  else if (r.conn_status === "accepted") relation = "connected";
  else if (r.conn_status === "pending")
    relation = r.conn_requester === viewer.id ? "outgoing" : "incoming";

  return {
    id: r.id as string,
    name: r.name as string,
    username: r.username as string,
    headline: (r.headline as string) ?? "",
    bio: (r.bio as string) ?? "",
    location: (r.location as string) ?? "",
    website: (r.website as string) ?? "",
    interests: (r.interests as string[]) ?? [],
    roles: (r.roles as string[]) ?? [],
    isVerified: r.is_verified as boolean,
    accent: r.accent as string,
    avatarUrl: (r.avatar_url as string) ?? null,
    institution: (r.institution as string) ?? "",
    joinedAt: r.created_at as string,
    postCount: Number(r.post_count ?? 0),
    connectionCount: Number(r.connection_count ?? 0),
    followerCount: Number(r.follower_count ?? 0),
    isFollowing: r.is_following as boolean,
    viewCount: Number(r.view_count ?? 0),
    relation,
  };
}

export async function recordProfileView(viewerId: string, profileId: string) {
  if (viewerId === profileId) return;
  await db.execute(sql`
    INSERT INTO profile_views (viewer_id, viewed_id)
    VALUES (${viewerId}::uuid, ${profileId}::uuid)
  `);
}

export async function listConnections(viewer: Viewer): Promise<PersonCard[]> {
  const res = await db.execute(sql`
    SELECT u.id, u.name, u.username, u.headline, u.roles, u.is_verified, u.accent, u.avatar_url, u.institution, u.location
    FROM connections c
    JOIN users u ON u.id = CASE WHEN c.requester_id = ${viewer.id}::uuid THEN c.addressee_id ELSE c.requester_id END
    WHERE c.status = 'accepted' AND (c.requester_id = ${viewer.id}::uuid OR c.addressee_id = ${viewer.id}::uuid)
    ORDER BY u.name ASC
    LIMIT 200
  `);
  return (res.rows as unknown as RawPerson[]).map(mapPerson);
}

export async function listRequests(viewer: Viewer): Promise<PersonCard[]> {
  const res = await db.execute(sql`
    SELECT u.id, u.name, u.username, u.headline, u.roles, u.is_verified, u.accent, u.avatar_url, u.institution, u.location
    FROM connections c
    JOIN users u ON u.id = c.requester_id
    WHERE c.status = 'pending' AND c.addressee_id = ${viewer.id}::uuid
    ORDER BY c.created_at DESC
  `);
  return (res.rows as unknown as RawPerson[]).map(mapPerson);
}

export async function listSuggestions(viewer: Viewer): Promise<PersonCard[]> {
  const interests = viewer.interests.length ? viewer.interests : ["Education"];
  const interestList = sql.join(
    interests.map((i) => sql`${i}`),
    sql`, `
  );
  const res = await db.execute(sql`
    SELECT u.id, u.name, u.username, u.headline, u.roles, u.is_verified, u.accent, u.avatar_url, u.institution, u.location,
           (SELECT count(*) FROM unnest(u.interests) i WHERE i IN (${interestList}))::int AS shared
    FROM users u
    WHERE u.id <> ${viewer.id}::uuid
      AND NOT EXISTS (
        SELECT 1 FROM connections c
        WHERE (c.requester_id = ${viewer.id}::uuid AND c.addressee_id = u.id)
           OR (c.addressee_id = ${viewer.id}::uuid AND c.requester_id = u.id))
      AND NOT EXISTS (
        SELECT 1 FROM blocks b
        WHERE (b.blocker_id = ${viewer.id}::uuid AND b.blocked_id = u.id)
           OR (b.blocker_id = u.id AND b.blocked_id = ${viewer.id}::uuid))
      AND u.onboarded = true
    ORDER BY shared DESC, u.is_verified DESC, u.created_at ASC
    LIMIT 8
  `);
  return (res.rows as unknown as RawPerson[]).map(mapPerson);
}

export async function sendConnection(viewer: Viewer, targetId: string) {
  if (targetId === viewer.id) return { state: "none" as const };
  // Accept automatically if the other side already requested
  const reverse = await db.execute(sql`
    SELECT id FROM connections
    WHERE requester_id = ${targetId}::uuid AND addressee_id = ${viewer.id}::uuid AND status = 'pending'
    LIMIT 1
  `);
  if (reverse.rows.length > 0) {
    const id = (reverse.rows[0] as { id: string }).id;
    await db.execute(sql`UPDATE connections SET status = 'accepted' WHERE id = ${id}::uuid`);
    return { state: "connected" as const, autoAccepted: true };
  }
  await db.execute(sql`
    INSERT INTO connections (requester_id, addressee_id, status)
    VALUES (${viewer.id}::uuid, ${targetId}::uuid, 'pending')
    ON CONFLICT (requester_id, addressee_id) DO NOTHING
  `);
  return { state: "outgoing" as const };
}

export async function respondConnection(viewer: Viewer, requesterId: string, accept: boolean) {
  const res = await db.execute(sql`
    UPDATE connections
    SET status = ${accept ? "accepted" : "declined"}
    WHERE requester_id = ${requesterId}::uuid AND addressee_id = ${viewer.id}::uuid AND status = 'pending'
    RETURNING id
  `);
  return res.rows.length > 0;
}

export async function removeConnection(viewer: Viewer, targetId: string) {
  await db.execute(sql`
    DELETE FROM connections
    WHERE (requester_id = ${viewer.id}::uuid AND addressee_id = ${targetId}::uuid)
       OR (addressee_id = ${viewer.id}::uuid AND requester_id = ${targetId}::uuid)
  `);
}

export async function toggleFollow(viewer: Viewer, targetId: string) {
  const existing = await db.execute(
    sql`SELECT 1 FROM follows WHERE follower_id = ${viewer.id}::uuid AND following_id = ${targetId}::uuid`
  );
  if (existing.rows.length > 0) {
    await db.execute(sql`DELETE FROM follows WHERE follower_id = ${viewer.id}::uuid AND following_id = ${targetId}::uuid`);
    return { following: false };
  }
  await db.execute(sql`
    INSERT INTO follows (follower_id, following_id) VALUES (${viewer.id}::uuid, ${targetId}::uuid)
    ON CONFLICT DO NOTHING
  `);
  return { following: true };
}

export async function blockUser(viewer: Viewer, targetId: string) {
  await db.execute(sql`
    INSERT INTO blocks (blocker_id, blocked_id) VALUES (${viewer.id}::uuid, ${targetId}::uuid)
    ON CONFLICT DO NOTHING
  `);
  await removeConnection(viewer, targetId);
}

export async function unblockUser(viewer: Viewer, targetId: string) {
  await db.execute(sql`DELETE FROM blocks WHERE blocker_id = ${viewer.id}::uuid AND blocked_id = ${targetId}::uuid`);
}

export async function listBlocked(viewer: Viewer): Promise<PersonCard[]> {
  const res = await db.execute(sql`
    SELECT u.id, u.name, u.username, u.headline, u.roles, u.is_verified, u.accent, u.avatar_url, u.institution, u.location
    FROM blocks b JOIN users u ON u.id = b.blocked_id
    WHERE b.blocker_id = ${viewer.id}::uuid
  `);
  return (res.rows as unknown as RawPerson[]).map(mapPerson);
}
