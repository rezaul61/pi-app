"use server";

import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getViewer } from "@/server/session";
import { isParticipant } from "@/server/guards";

export async function getThreadPreviewAction(conversationId: string) {
  const viewer = await getViewer();
  if (!viewer) return null;
  if (!(await isParticipant(conversationId, viewer.id))) return null;

  const res = await db.execute(sql`
    SELECT id, sender_id, content, created_at
    FROM messages
    WHERE conversation_id = ${conversationId}::uuid
    ORDER BY created_at DESC
    LIMIT 12
  `);

  return (res.rows as any[]).reverse().map(r => ({
    id: r.id,
    content: r.content,
    mine: r.sender_id === viewer.id,
    createdAt: r.created_at,
  }));
}

export async function getNotificationPreviewAction(type: string, href: string, actorId: string | null) {
  const viewer = await getViewer();
  if (!viewer) return null;

  let contextData: any = null;

  // Extract post ID if it's a post-related notification
  const postMatch = href.match(/\/post\/([a-f0-9-]+)/);
  const postId = postMatch ? postMatch[1] : null;

  if (type === "comment" && postId && actorId) {
    // Fetch the actual comment content
    const res = await db.execute(sql`
      SELECT content, created_at 
      FROM comments 
      WHERE post_id = ${postId}::uuid AND author_id = ${actorId}::uuid
      ORDER BY created_at DESC LIMIT 1
    `);
    if (res.rows[0]) {
      contextData = { 
        type: "comment", 
        text: (res.rows[0] as any).content 
      };
    }
  } 
  else if (type === "reaction" && postId && actorId) {
    // In case reaction notifications are added
    const res = await db.execute(sql`
      SELECT type FROM reactions 
      WHERE post_id = ${postId}::uuid AND user_id = ${actorId}::uuid LIMIT 1
    `);
    if (res.rows[0]) {
      contextData = { type: "reaction", reaction: (res.rows[0] as any).type };
    }
  }
  else if ((type === "connection_request" || type === "connection_accepted") && actorId) {
    // Fetch user bio / headline
    const res = await db.execute(sql`
      SELECT headline, bio FROM users WHERE id = ${actorId}::uuid LIMIT 1
    `);
    if (res.rows[0]) {
      contextData = { 
        type: "profile", 
        headline: (res.rows[0] as any).headline,
        bio: (res.rows[0] as any).bio 
      };
    }
  }

  return contextData;
}
