"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/server/session";
import {
  addCommentNotify,
  createEvent,
  createPost,
  deletePost,
  getPost,
  toggleReaction,
  toggleSavePost,
  votePoll,
} from "@/server/services/feed";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { createReport, notify } from "@/server/services/misc";

export type ActionResult = { ok: boolean; message?: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const POST_KINDS = ["post", "article", "research", "achievement", "publication", "job", "project", "event", "poll"];

async function accessiblePost(viewer: NonNullable<Awaited<ReturnType<typeof getViewer>>>, postId: string) {
  return UUID_RE.test(postId) ? getPost(viewer, postId) : null;
}

export async function createPostAction(input: {
  kind: string;
  title?: string;
  content: string;
  visibility?: string;
  tags?: string[];
  communityId?: string;
  mediaUrl?: string;
  meta?: Record<string, unknown>;
  pollOptions?: string[];
  event?: { startsAt: string; location: string; online: boolean };
}): Promise<ActionResult & { id?: string }> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "You are signed out." };

  const content = input.content.trim();
  if (content.length < 2) return { ok: false, message: "Write something first." };
  if (content.length > 4000) return { ok: false, message: "Keep it under 4,000 characters." };

  const kind = POST_KINDS.includes(input.kind)
    ? input.kind
    : "post";
  const title = (input.title ?? "").trim().slice(0, 140);
  if ((kind === "article" || kind === "event" || kind === "achievement" || kind === "publication" || kind === "job" || kind === "project") && title.length < 4)
    return { ok: false, message: "Give it a clear title." };

  const tags = (input.tags ?? [])
    .map((t) => t.trim().replace(/^#/, ""))
    .filter((t) => t.length >= 2 && t.length <= 28)
    .slice(0, 6);

  const visibility = input.visibility === "network" ? "network" : "public";
  const meta: Record<string, unknown> = input.meta ?? {};

  if (kind === "poll") {
    const options = (input.pollOptions ?? []).map((o) => o.trim()).filter((o) => o.length > 0 && o.length <= 80);
    if (options.length < 2) return { ok: false, message: "A poll needs at least two options." };
    meta.options = options.slice(0, 5).map((label) => ({ label }));
  }

  if (kind === "event" && input.event) {
    if (!input.event.startsAt || Number.isNaN(Date.parse(input.event.startsAt))) {
      return { ok: false, message: "Choose a valid event date and time." };
    }
    meta.startsAt = input.event.startsAt;
    meta.location = input.event.location.slice(0, 120);
    meta.online = input.event.online;
  }

  const mediaUrls = Array.isArray(meta.mediaUrls) ? meta.mediaUrls : input.mediaUrl ? [input.mediaUrl] : [];
  if (mediaUrls.length > 6 || mediaUrls.some((url) => typeof url !== "string" || !url.startsWith("/uploads/"))) {
    return { ok: false, message: "Invalid media attachment." };
  }
  if (mediaUrls.length) meta.mediaUrls = mediaUrls;

  const id = await createPost(viewer, {
    kind,
    title,
    content,
    visibility,
    tags,
    communityId: input.communityId,
    mediaUrl: input.mediaUrl?.trim() || undefined,
    meta,
  });

  if (kind === "event" && input.event) {
    await createEvent(viewer, {
      communityId: input.communityId ?? null,
      title,
      description: content.slice(0, 500),
      startsAt: input.event.startsAt,
      location: input.event.location.slice(0, 120),
      online: input.event.online,
    });
  }

  revalidatePath("/home");
  if (input.communityId) revalidatePath(`/communities`);
  return { ok: true, id };
}

export async function deletePostAction(postId: string): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false };
  const done = await deletePost(viewer, postId);
  revalidatePath("/home");
  return { ok: done, message: done ? undefined : "You can only remove your own posts." };
}

export async function repostAction(postId: string): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false };

  const post = await accessiblePost(viewer, postId);
  if (!post) return { ok: false, message: "Post not found" };

  await db.execute(sql`
    INSERT INTO posts (author_id, kind, content, visibility, reposted_from_id, meta)
    VALUES (${viewer.id}::uuid, 'post', ${post.content}, 'public', ${postId}::uuid, ${JSON.stringify(post.meta)}::jsonb)
  `);

  revalidatePath("/home");
  return { ok: true };
}

export async function reactAction(postId: string, type: string): Promise<{ active: boolean }> {
  const viewer = await getViewer();
  if (!viewer) return { active: false };
  if (!(await accessiblePost(viewer, postId))) return { active: false };
  const safe = ["insightful", "appreciate", "curious"].includes(type) ? type : "insightful";
  return toggleReaction(viewer, postId, safe);
}

export async function commentAction(postId: string, content: string, parentId?: string): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false };
  if (!(await accessiblePost(viewer, postId))) return { ok: false, message: "Post not found." };
  const text = content.trim();
  if (text.length < 1 || text.length > 1200) return { ok: false, message: "Comment is empty or too long." };

  await db.execute(sql`
    INSERT INTO comments (post_id, author_id, content, parent_id)
    VALUES (${postId}::uuid, ${viewer.id}::uuid, ${text}, ${parentId || null}::uuid)
  `);
  await addCommentNotify(viewer, postId);
  return { ok: true };
}

export async function categorizeCommentAction(commentId: string, category: string): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false };
  
  if (!["interesting", "informative", "helpful"].includes(category)) return { ok: false };

  await db.execute(sql`
    UPDATE comments 
    SET category_counts = coalesce(category_counts, '{}'::jsonb) || 
      jsonb_build_object(${category}, (coalesce((category_counts->>${category})::int, 0) + 1))
    WHERE id = ${commentId}::uuid
  `);
  
  return { ok: true };
}

export async function savePostAction(postId: string, title: string): Promise<{ saved: boolean }> {
  const viewer = await getViewer();
  if (!viewer) return { saved: false };
  if (!(await accessiblePost(viewer, postId))) return { saved: false };
  return toggleSavePost(viewer, postId, title || "Saved post");
}

export async function votePollAction(postId: string, optionIndex: number): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false };
  const post = await accessiblePost(viewer, postId);
  const options = Array.isArray(post?.meta?.options) ? post.meta.options : [];
  if (!post || post.kind !== "poll" || !Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= options.length) {
    return { ok: false, message: "Invalid poll choice." };
  }
  await votePoll(viewer, postId, optionIndex);
  return { ok: true };
}

export async function reportAction(
  targetType: string,
  targetId: string,
  reason: string
): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false };
  if (!reason.trim()) return { ok: false, message: "Choose a reason." };
  await createReport(viewer, {
    targetType,
    targetId,
    reason: reason.slice(0, 80),
  });
  return { ok: true, message: "Report received. PI Trust will review it." };
}

export { notify };
