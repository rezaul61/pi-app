import "server-only";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { isParticipant } from "@/server/guards";
import type { Viewer } from "@/server/session";
import { INTERESTS } from "@/lib/constants";

export type ConversationPerson = {
  id: string;
  name: string;
  username: string;
  headline: string;
  roles: string[];
  isVerified: boolean;
  accent: string;
  avatarUrl: string | null;
  interests: string[];
  institution: string;
  location: string;
};

export type ConversationSummary = {
  id: string;
  other: ConversationPerson;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  mine: boolean;
  sharedInterests: string[];
  cadence: "new" | "active" | "warm" | "quiet";
};

export type MessageRow = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  mine: boolean;
  isUnread: boolean;
  importantLabel: string | null; // null = not marked, string = the label the viewer gave it
  meta: { attachments?: Array<{ url: string; type: "image" | "video" | "audio" | "file" | "sticker" }>; location?: { label: string; latitude: number; longitude: number } };
};

export type ImportantMsg = {
  id: string;
  messageId: string;
  label: string;
  content: string;
  senderName: string;
  createdAt: string;
};

export type ThreadInsight = {
  summary: string;
  themes: string[];
  actionItems: string[];
  suggestedReplies: string[];
  collaborationNote: string;
  cadence: ConversationSummary["cadence"];
};

function cadenceOf(lastMessageAt: string): ConversationSummary["cadence"] {
  const hours = (Date.now() - +new Date(lastMessageAt)) / 3_600_000;
  if (hours < 6) return "active";
  if (hours < 48) return "warm";
  if (hours < 21 * 24) return "quiet";
  return "new";
}

function mapPerson(r: Record<string, unknown>): ConversationPerson {
  return {
    id: r.other_id ? (r.other_id as string) : (r.id as string),
    name: r.name as string,
    username: r.username as string,
    headline: (r.headline as string) ?? "",
    roles: (r.roles as string[]) ?? [],
    isVerified: r.is_verified as boolean,
    accent: r.accent as string,
    avatarUrl: (r.avatar_url as string) ?? null,
    interests: (r.interests as string[]) ?? [],
    institution: (r.institution as string) ?? "",
    location: (r.location as string) ?? "",
  };
}

function buildInsight(viewer: Viewer, other: ConversationPerson, messages: MessageRow[]): ThreadInsight {
  const transcript = messages.map((m) => m.content).join(" \n ").toLowerCase();
  const sharedInterests = viewer.interests.filter((i) => other.interests.includes(i)).slice(0, 4);
  const mentionThemes = INTERESTS.filter((interest) => transcript.includes(interest.split(" ")[0].toLowerCase()));
  const themes = Array.from(new Set([...sharedInterests, ...mentionThemes])).slice(0, 4);
  const cadence = messages.length ? cadenceOf(messages[messages.length - 1].createdAt) : "new";

  const incoming = [...messages].reverse().filter((m) => !m.mine);
  const asks = incoming
    .filter((m) => /\?|review|draft|share|send|schedule|meet|call|collabor|feedback|look at/i.test(m.content))
    .slice(0, 3)
    .map((m) => m.content.trim().replace(/\s+/g, " ").slice(0, 120));

  const latestIncoming = incoming[0]?.content.trim().replace(/\s+/g, " ") ?? "";
  const actionItems = asks.length
    ? asks
    : latestIncoming
      ? [latestIncoming.slice(0, 120)]
      : ["No explicit asks yet — this thread is open for a useful next step."];

  let suggestedReplies = [
    "Happy to look — send me the latest version.",
    "That’s useful context. What would move this forward fastest?",
    "I can make time this week — share two slots that work for you.",
  ];
  if (/review|draft|paper|preprint|manuscript/i.test(transcript)) {
    suggestedReplies = [
      "Send the draft and I’ll leave focused notes this week.",
      "I can review methods + clarity first, then we can tighten the framing.",
      "If it helps, I’ll read for the skeptical outsider perspective.",
    ];
  } else if (/schedule|meet|call|sync|calendar/i.test(transcript)) {
    suggestedReplies = [
      "Let’s turn this into a 20-minute sync — send two times that suit you.",
      "I’m free later this week. Want to put a short call on the calendar?",
      "A quick sync sounds right — what outcome do you want from it?",
    ];
  } else if (/share|dataset|notebook|repo|link/i.test(transcript)) {
    suggestedReplies = [
      "Send the link when it’s ready — I’ll go through it carefully.",
      "If you share the materials, I can respond with specific feedback.",
      "A repo or notebook would help me give a precise answer.",
    ];
  }

  const summaryBase = latestIncoming || messages[messages.length - 1]?.content || "This conversation has just started.";
  const summary = sharedInterests.length
    ? `${other.name.split(" ")[0]} and you overlap on ${sharedInterests.slice(0, 2).join(" and ")}. Most recent thread energy: ${summaryBase.slice(0, 150)}.`
    : `${other.name.split(" ")[0]} and you are building context. Most recent thread energy: ${summaryBase.slice(0, 150)}.`;

  const collaborationNote = sharedInterests.length
    ? `Best collaboration angle right now: ${sharedInterests.slice(0, 2).join(" + ")} across your combined roles.`
    : `${other.name.split(" ")[0]} brings ${other.roles.join(" / ") || "a complementary perspective"}; this thread can become a useful working relationship.`;

  return {
    summary,
    themes,
    actionItems,
    suggestedReplies,
    collaborationNote,
    cadence,
  };
}

export async function listConversations(viewer: Viewer): Promise<ConversationSummary[]> {
  const res = await db.execute(sql`
    SELECT cv.id,
           u.id AS other_id, u.name, u.username, u.headline, u.roles, u.is_verified, u.accent, u.avatar_url,
           u.interests, u.institution, u.location,
           (SELECT content FROM messages m WHERE m.conversation_id = cv.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
           cv.last_message_at,
           (SELECT count(*) FROM messages m2
             WHERE m2.conversation_id = cv.id AND m2.sender_id <> ${viewer.id}::uuid
               AND (p.last_read_at IS NULL OR m2.created_at > p.last_read_at))::int AS unread,
           (SELECT sender_id = ${viewer.id}::uuid FROM messages m3
             WHERE m3.conversation_id = cv.id ORDER BY m3.created_at DESC LIMIT 1) AS mine
    FROM participants p
    JOIN conversations cv ON cv.id = p.conversation_id
    JOIN participants p2 ON p2.conversation_id = cv.id AND p2.user_id <> ${viewer.id}::uuid
    JOIN users u ON u.id = p2.user_id
    WHERE p.user_id = ${viewer.id}::uuid
    ORDER BY cv.last_message_at DESC
  `);

  return (res.rows as unknown as Array<Record<string, unknown>>).map((r) => {
    const other = mapPerson(r);
    const sharedInterests = viewer.interests.filter((i) => other.interests.includes(i)).slice(0, 3);
    return {
      id: r.id as string,
      other,
      lastMessage: (r.last_message as string) ?? "",
      lastMessageAt: r.last_message_at as string,
      unread: Number(r.unread ?? 0),
      mine: (r.mine as boolean) ?? false,
      sharedInterests,
      cadence: cadenceOf(r.last_message_at as string),
    };
  });
}

export async function getThread(
  viewer: Viewer,
  conversationId: string
): Promise<{
  messages: MessageRow[];
  other: ConversationPerson | null;
  insight: ThreadInsight;
  importantMessages: ImportantMsg[];
  meta: {
    startedAt: string;
    lastMessageAt: string;
    messageCount: number;
    firstUnreadId: string | null;
  };
} | null> {
  if (!(await isParticipant(conversationId, viewer.id))) return null;

  const detailRes = await db.execute(sql`
    SELECT cv.created_at, cv.last_message_at, p.last_read_at,
           u.id AS other_id, u.name, u.username, u.headline, u.roles, u.is_verified, u.accent,
           u.avatar_url, u.interests, u.institution, u.location
    FROM conversations cv
    JOIN participants p ON p.conversation_id = cv.id AND p.user_id = ${viewer.id}::uuid
    JOIN participants p2 ON p2.conversation_id = cv.id AND p2.user_id <> ${viewer.id}::uuid
    JOIN users u ON u.id = p2.user_id
    WHERE cv.id = ${conversationId}::uuid
    LIMIT 1
  `);
  const d = detailRes.rows[0] as Record<string, unknown> | undefined;
  if (!d) return null;
  const other = mapPerson(d);
  const lastReadAt = d.last_read_at ? +new Date(d.last_read_at as string) : null;

  const [msgRes, impRes] = await Promise.all([
    db.execute(sql`
      SELECT id, sender_id, content, meta, created_at
      FROM messages
      WHERE conversation_id = ${conversationId}::uuid
      ORDER BY created_at ASC
      LIMIT 300
    `),
    db.execute(sql`
      SELECT im.id, im.message_id, im.label, m.content, u.name AS sender_name, m.created_at
      FROM important_messages im
      JOIN messages m ON m.id = im.message_id
      JOIN users u ON u.id = m.sender_id
      WHERE im.conversation_id = ${conversationId}::uuid AND im.marked_by = ${viewer.id}::uuid
      ORDER BY m.created_at ASC
    `),
  ]);

  const impMap = new Map<string, string>();
  const importantList: ImportantMsg[] = (impRes.rows as unknown as Array<Record<string, unknown>>).map((r) => {
    impMap.set(r.message_id as string, (r.label as string) || "");
    return {
      id: r.id as string,
      messageId: r.message_id as string,
      label: (r.label as string) || "",
      content: r.content as string,
      senderName: r.sender_name as string,
      createdAt: r.created_at as string,
    };
  });

  const messages = (msgRes.rows as unknown as Array<Record<string, unknown>>).map((r) => {
    const createdAt = r.created_at as string;
    const mine = r.sender_id === viewer.id;
    return {
      id: r.id as string,
      senderId: r.sender_id as string,
      content: r.content as string,
      createdAt,
      mine,
      isUnread: !mine && !!lastReadAt && +new Date(createdAt) > lastReadAt,
      importantLabel: impMap.get(r.id as string) ?? null,
      meta: (r.meta as MessageRow["meta"]) ?? {},
    };
  });
  const firstUnreadId = messages.find((m) => m.isUnread)?.id ?? null;
  const insight = buildInsight(viewer, other, messages);

  await db.execute(sql`
    UPDATE participants SET last_read_at = now()
    WHERE conversation_id = ${conversationId}::uuid AND user_id = ${viewer.id}::uuid
  `);

  return {
    messages,
    other,
    insight,
    importantMessages: importantList,
    meta: {
      startedAt: d.created_at as string,
      lastMessageAt: d.last_message_at as string,
      messageCount: messages.length,
      firstUnreadId,
    },
  };
}

export async function startConversation(viewer: Viewer, targetId: string): Promise<string | null> {
  if (targetId === viewer.id) return null;
  const existing = await db.execute(sql`
    SELECT p1.conversation_id AS id
    FROM participants p1
    JOIN participants p2 ON p2.conversation_id = p1.conversation_id
    WHERE p1.user_id = ${viewer.id}::uuid AND p2.user_id = ${targetId}::uuid
    LIMIT 1
  `);
  if (existing.rows.length > 0) return (existing.rows[0] as { id: string }).id;

  const created = await db.execute(sql`INSERT INTO conversations DEFAULT VALUES RETURNING id`);
  const id = (created.rows[0] as { id: string }).id;
  await db.execute(sql`
    INSERT INTO participants (conversation_id, user_id) VALUES
    (${id}::uuid, ${viewer.id}::uuid), (${id}::uuid, ${targetId}::uuid)
  `);
  return id;
}

export async function sendMessage(viewer: Viewer, conversationId: string, content: string, meta: MessageRow["meta"] = {}) {
  if (!(await isParticipant(conversationId, viewer.id))) return false;
  await db.execute(sql`
    INSERT INTO messages (conversation_id, sender_id, content, meta)
    VALUES (${conversationId}::uuid, ${viewer.id}::uuid, ${content}, ${JSON.stringify(meta)}::jsonb)
  `);
  await db.execute(sql`
    UPDATE conversations SET last_message_at = now() WHERE id = ${conversationId}::uuid
  `);
  return true;
}

export async function threadPartners(viewer: Viewer, conversationId: string) {
  const res = await db.execute(sql`
    SELECT user_id FROM participants
    WHERE conversation_id = ${conversationId}::uuid AND user_id <> ${viewer.id}::uuid
  `);
  return (res.rows as unknown as Array<{ user_id: string }>).map((r) => r.user_id);
}
