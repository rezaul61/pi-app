import "server-only";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import type { Viewer } from "@/server/session";
import { listConversations } from "./messages";
import { listEvents, listCommunities } from "./communities";
import { listOpportunities, networkStats, topOpportunities, unreadCount } from "./misc";

export type CalendarEntry = {
  id: string;
  title: string;
  kind: "event" | "deadline";
  date: string;
  href: string;
  subtitle: string;
  location: string;
  urgency: "soon" | "upcoming" | "later";
};

export async function calendarAgenda(viewer: Viewer): Promise<CalendarEntry[]> {
  const [events, opportunities] = await Promise.all([listEvents(viewer), listOpportunities(viewer)]);
  const deadlineItems = opportunities
    .filter((o) => o.deadline)
    .slice(0, 18)
    .map((o) => ({
      id: o.id,
      title: o.title,
      kind: "deadline" as const,
      date: o.deadline!,
      href: "/opportunities",
      subtitle: `${o.org} · ${o.kind}`,
      location: o.remote ? "Remote / online" : o.location || "Location flexible",
      urgency:
        +new Date(o.deadline!) - Date.now() < 14 * 86400000
          ? ("soon" as const)
          : +new Date(o.deadline!) - Date.now() < 45 * 86400000
            ? ("upcoming" as const)
            : ("later" as const),
    }));

  const eventItems: CalendarEntry[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    kind: "event",
    date: e.startsAt,
    href: e.communitySlug ? `/communities/${e.communitySlug}?tab=events` : "/communities",
    subtitle: e.communityName ? `${e.communityName} · event` : "Community event",
    location: e.online ? "Online" : e.location || "Venue TBA",
    urgency:
      +new Date(e.startsAt) - Date.now() < 14 * 86400000
        ? ("soon" as const)
        : +new Date(e.startsAt) - Date.now() < 45 * 86400000
          ? ("upcoming" as const)
          : ("later" as const),
  }));

  return [...eventItems, ...deadlineItems]
    .filter((i) => +new Date(i.date) > Date.now() - 86400000)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));
}

export async function piInsight(viewer: Viewer) {
  const [stats, counts, topMatches, communities, conversations] = await Promise.all([
    networkStats(viewer),
    unreadCount(viewer),
    topOpportunities(viewer),
    listCommunities(viewer),
    listConversations(viewer),
  ]);

  const recentPosts = await db.execute(sql`
    SELECT kind, count(*)::int AS n
    FROM posts
    WHERE author_id = ${viewer.id}::uuid AND created_at > now() - interval '90 days'
    GROUP BY kind
    ORDER BY n DESC
  `);
  const vaultCount = await db.execute(sql`
    SELECT count(*)::int AS n FROM vault_items WHERE user_id = ${viewer.id}::uuid
  `);
  const incomingQuestions = await db.execute(sql`
    SELECT count(*)::int AS n
    FROM messages m
    JOIN participants p ON p.conversation_id = m.conversation_id AND p.user_id = ${viewer.id}::uuid
    WHERE m.sender_id <> ${viewer.id}::uuid
      AND m.content LIKE '%?%'
      AND m.created_at > now() - interval '30 days'
  `);

  const postMix = (recentPosts.rows as unknown as Array<{ kind: string; n: number }>).map((r) => ({
    kind: r.kind,
    count: Number(r.n),
  }));
  const joined = communities.filter((c) => c.joined);
  const strongestThemes = Array.from(new Set(joined.flatMap((c) => [c.category, c.name]))).slice(0, 5);
  const warmThreads = conversations.filter((c) => c.cadence === "active" || c.cadence === "warm").length;

  return {
    stats,
    counts,
    topMatches,
    postMix,
    vaultCount: Number((vaultCount.rows[0] as { n: number } | undefined)?.n ?? 0),
    incomingQuestions: Number((incomingQuestions.rows[0] as { n: number } | undefined)?.n ?? 0),
    strongestThemes,
    warmThreads,
    joinedCommunities: joined.slice(0, 4),
  };
}
