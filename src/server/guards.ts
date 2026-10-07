import "server-only";
import { db } from "@/db";
import { sql } from "drizzle-orm";

/* ============================================================
   PI Guard Layer — the application-level RLS equivalent.
   Every service query must pass through one of these checks;
   raw table access from pages/actions is not permitted.
   ============================================================ */

export function blockClause(viewerId: string, column = "p.author_id") {
  /* SQL fragment excluding content from users in a block relationship */
  return sql`AND NOT EXISTS (
    SELECT 1 FROM blocks b
    WHERE (b.blocker_id = ${viewerId}::uuid AND b.blocked_id = ${sql.raw(column)})
       OR (b.blocker_id = ${sql.raw(column)} AND b.blocked_id = ${viewerId}::uuid)
  )`;
}

export function visibilityClause(viewerId: string) {
  /* public OR own OR network-visible-to-connections */
  return sql`AND (
    p.visibility = 'public'
    OR p.author_id = ${viewerId}::uuid
    OR EXISTS (
      SELECT 1 FROM connections c
      WHERE c.status = 'accepted'
        AND ((c.requester_id = ${viewerId}::uuid AND c.addressee_id = p.author_id)
          OR (c.addressee_id = ${viewerId}::uuid AND c.requester_id = p.author_id))
    )
  )`;
}

export async function isParticipant(conversationId: string, userId: string) {
  const res = await db.execute(
    sql`SELECT 1 FROM participants
        WHERE conversation_id = ${conversationId}::uuid AND user_id = ${userId}::uuid
        LIMIT 1`
  );
  return res.rows.length > 0;
}

export async function isBlockedEither(a: string, b: string) {
  const res = await db.execute(
    sql`SELECT 1 FROM blocks
        WHERE (blocker_id = ${a}::uuid AND blocked_id = ${b}::uuid)
           OR (blocker_id = ${b}::uuid AND blocked_id = ${a}::uuid)
        LIMIT 1`
  );
  return res.rows.length > 0;
}

export async function connectionStatus(a: string, b: string) {
  const res = await db.execute(
    sql`SELECT id, requester_id, status FROM connections
        WHERE (requester_id = ${a}::uuid AND addressee_id = ${b}::uuid)
           OR (requester_id = ${b}::uuid AND addressee_id = ${a}::uuid)
        LIMIT 1`
  );
  const row = res.rows[0] as
    | { id: string; requester_id: string; status: string }
    | undefined;
  if (!row) return { state: "none" as const };
  if (row.status === "accepted") return { state: "connected" as const, id: row.id };
  if (row.status === "pending")
    return row.requester_id === a
      ? ({ state: "outgoing" as const, id: row.id })
      : ({ state: "incoming" as const, id: row.id });
  return { state: "none" as const, id: row.id };
}

export async function ownsPost(postId: string, userId: string) {
  const res = await db.execute(
    sql`SELECT 1 FROM posts WHERE id = ${postId}::uuid AND author_id = ${userId}::uuid LIMIT 1`
  );
  return res.rows.length > 0;
}

export function assertUnreachable(): never {
  throw new Error("Guard breached");
}
