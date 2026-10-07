"use server";

import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getViewer } from "@/server/session";
import { sendMessage, threadPartners } from "@/server/services/messages";
import { notify } from "@/server/services/misc";
import { isParticipant } from "@/server/guards";

export async function sendMessageAction(conversationId: string, content: string, meta: { attachments?: Array<{ url: string; type: "image" | "video" | "audio" | "file" | "sticker" }>; location?: { label: string; latitude: number; longitude: number } } = {}) {
  const viewer = await getViewer();
  if (!viewer) return { ok: false };
  const text = content.trim();
  const attachments = meta.attachments ?? [];
  if ((!text && !attachments.length && !meta.location) || text.length > 2000 || attachments.length > 6) return { ok: false };
  if (attachments.some((a) => !a.url.startsWith("/uploads/") || !["image", "video", "audio", "file", "sticker"].includes(a.type))) return { ok: false };

  const ok = await sendMessage(viewer, conversationId, text, { attachments, location: meta.location });
  if (ok) {
    const partners = await threadPartners(viewer, conversationId);
    await Promise.all(
      partners.map((pid) =>
        notify(pid, viewer.id, "message", `${viewer.name} sent you a message.`, `/messages/${conversationId}`)
      )
    );
  }
  return { ok };
}

export async function markImportantAction(conversationId: string, messageId: string, label: string) {
  const viewer = await getViewer();
  if (!viewer) return { ok: false };
  if (!(await isParticipant(conversationId, viewer.id))) return { ok: false };

  await db.execute(sql`
    INSERT INTO important_messages (conversation_id, message_id, marked_by, label)
    VALUES (${conversationId}::uuid, ${messageId}::uuid, ${viewer.id}::uuid, ${label.slice(0, 60)})
    ON CONFLICT (message_id, marked_by)
    DO UPDATE SET label = ${label.slice(0, 60)}
  `);
  return { ok: true };
}

export async function unmarkImportantAction(messageId: string) {
  const viewer = await getViewer();
  if (!viewer) return { ok: false };

  await db.execute(sql`
    DELETE FROM important_messages
    WHERE message_id = ${messageId}::uuid AND marked_by = ${viewer.id}::uuid
  `);
  return { ok: true };
}
