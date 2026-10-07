import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
  integer,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/* ------------------------------------------------------------------ users */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    username: text("username").notNull().unique(),
    email: text("email").notNull().unique(),
    passHash: text("pass_hash").notNull(),
    headline: text("headline").notNull().default(""),
    bio: text("bio").notNull().default(""),
    location: text("location").notNull().default(""),
    institution: text("institution").notNull().default(""),
    website: text("website").notNull().default(""),
    accent: text("accent").notNull().default("aurora"),
    avatarUrl: text("avatar_url"),
    coverUrl: text("cover_url"),
    primaryRole: text("primary_role").notNull().default("professional"),
    roles: text("roles")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    interests: text("interests")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    goals: text("goals")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    isVerified: boolean("is_verified").notNull().default(false),
    isAdmin: boolean("is_admin").notNull().default(false),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    onboarded: boolean("onboarded").notNull().default(false),
    theme: text("theme").notNull().default("dark"),
    fx: text("fx").notNull().default("premium"),
    oppAlerts: boolean("opp_alerts").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("users_username_idx").on(t.username)]
);

export const sessions = pgTable(
  "sessions",
  {
    token: text("token").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userAgent: text("user_agent").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)]
);

/* --------------------------------------------------------------- network */
export const connections = pgTable(
  "connections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    addresseeId: uuid("addressee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"), // pending | accepted | declined
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("connections_pair_idx").on(t.requesterId, t.addresseeId),
    index("connections_addressee_idx").on(t.addresseeId, t.status),
  ]
);

export const follows = pgTable(
  "follows",
  {
    followerId: uuid("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: uuid("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.followerId, t.followingId] })]
);

export const blocks = pgTable(
  "blocks",
  {
    blockerId: uuid("blocker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blockedId: uuid("blocked_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.blockerId, t.blockedId] })]
);

/* ----------------------------------------------------------------- posts */
export const posts = pgTable(
  "posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    communityId: uuid("community_id").references(() => communities.id, {
      onDelete: "cascade",
    }),
    kind: text("kind").notNull().default("post"), // post | article | research | project | event | poll
    title: text("title").notNull().default(""),
    content: text("content").notNull(),
    mediaUrl: text("media_url"),
    visibility: text("visibility").notNull().default("public"), // public | network
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    repostedFromId: uuid("reposted_from_id").references((): any => posts.id, { onDelete: "set null" }),
    taggedUserIds: uuid("tagged_user_ids")
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("posts_author_idx").on(t.authorId, t.createdAt),
    index("posts_created_idx").on(t.createdAt),
    index("posts_community_idx").on(t.communityId, t.createdAt),
  ]
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): any => comments.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    categoryCounts: jsonb("category_counts").$type<Record<string, number>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("comments_post_idx").on(t.postId, t.createdAt)]
);

export const profileViews = pgTable(
  "profile_views",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    viewerId: uuid("viewer_id").references(() => users.id, { onDelete: "cascade" }),
    viewedId: uuid("viewed_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("profile_views_target_idx").on(t.viewedId)]
);

export const reactions = pgTable(
  "reactions",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull().default("insightful"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId] })]
);

export const pollVotes = pgTable(
  "poll_votes",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    optionIndex: integer("option_index").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId] })]
);

/* -------------------------------------------------------------- messages */
export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const participants = pgTable(
  "participants",
  {
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastReadAt: timestamp("last_read_at", { withTimezone: true }),
  },
  (t) => [
    primaryKey({ columns: [t.conversationId, t.userId] }),
    index("participants_user_idx").on(t.userId),
  ]
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    meta: jsonb("meta").$type<{ attachments?: Array<{ url: string; type: "image" | "video" | "audio" | "file" | "sticker" }>; location?: { label: string; latitude: number; longitude: number } }>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_conv_idx").on(t.conversationId, t.createdAt)]
);

export const messageReactions = pgTable("message_reactions", {
  messageId: uuid("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.messageId, t.userId, t.emoji] })]);

export const zones = pgTable("zones", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  coverUrl: text("cover_url"),
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const zoneMembers = pgTable("zone_members", {
  zoneId: uuid("zone_id").notNull().references(() => zones.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.zoneId, t.userId] })]);

/* ------------------------------------------------------------ communities */
export const communities = pgTable(
  "communities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    tagline: text("tagline").notNull().default(""),
    description: text("description").notNull().default(""),
    category: text("category").notNull().default("Research"),
    accent: text("accent").notNull().default("aurora"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("communities_category_idx").on(t.category)]
);

export const communityMembers = pgTable(
  "community_members",
  {
    communityId: uuid("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"), // member | expert | moderator
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.communityId, t.userId] }),
    index("community_members_user_idx").on(t.userId),
  ]
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    communityId: uuid("community_id").references(() => communities.id, {
      onDelete: "cascade",
    }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    location: text("location").notNull().default(""),
    online: boolean("online").notNull().default(true),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("events_community_idx").on(t.communityId, t.startsAt)]
);

/* ---------------------------------------------------------- notifications */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // connection_request | connection_accepted | comment | message | verify | system
    body: text("body").notNull(),
    href: text("href").notNull().default("/notifications"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.createdAt)]
);

/* ------------------------------------------------------------------ vault */
export const vaultItems = pgTable(
  "vault_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("note"), // note | link | post
    title: text("title").notNull(),
    note: text("note").notNull().default(""),
    url: text("url"),
    postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("vault_user_idx").on(t.userId, t.createdAt)]
);

/* ------------------------------------------------------------ opportunities */
export const opportunities = pgTable(
  "opportunities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: text("kind").notNull().default("job"), // job | scholarship | conference | grant | internship
    title: text("title").notNull(),
    org: text("org").notNull(),
    description: text("description").notNull().default(""),
    location: text("location").notNull().default(""),
    remote: boolean("remote").notNull().default(false),
    funding: text("funding").notNull().default(""),
    deadline: timestamp("deadline", { withTimezone: true }),
    eligibility: text("eligibility")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    applyUrl: text("apply_url").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("opportunities_kind_idx").on(t.kind)]
);

export const savedOpportunities = pgTable(
  "saved_opportunities",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.opportunityId] })]
);

/* -------------------------------------------------------- important msgs */
export const importantMessages = pgTable(
  "important_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    markedBy: uuid("marked_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: text("label").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("important_msg_unique").on(t.messageId, t.markedBy),
    index("important_conv_idx").on(t.conversationId, t.markedBy),
  ]
);

/* ------------------------------------------------------------- moderation */
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetType: text("target_type").notNull(), // post | user | comment
    targetId: text("target_id").notNull(),
    reason: text("reason").notNull(),
    detail: text("detail").notNull().default(""),
    status: text("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("reports_status_idx").on(t.status)]
);

export type UserRow = typeof users.$inferSelect;
