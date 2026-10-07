import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Globe2, MapPin, Users } from "lucide-react";
import { getViewer } from "@/server/session";
import { getCommunity, listCommunityMembers, listEvents } from "@/server/services/communities";
import { listFeed } from "@/server/services/feed";
import { Card, Chip, EmptyState, SectionTitle } from "@/components/pi/primitives";
import { Avatar } from "@/components/pi/avatar";
import { RoleBadge } from "@/components/pi/badge";
import { PostCard } from "@/components/post/post-card";
import { QuickComposer } from "@/components/post/quick-composer";
import { JoinCommunityButton } from "@/components/people/person-actions";
import { accentGradient, cn, fmtDateTime } from "@/lib/utils";

const TABS = [
  { key: "discussions", label: "Discussions" },
  { key: "knowledge", label: "Knowledge" },
  { key: "members", label: "Members" },
  { key: "events", label: "Events" },
  { key: "about", label: "About" },
];

export default async function CommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab = "discussions" } = await searchParams;
  const viewer = (await getViewer())!;
  const community = await getCommunity(viewer, slug);
  if (!community) notFound();

  const pulseLevel = Math.min(5, community.weeklyPosts);

  return (
    <div className="anim-in-up space-y-5">
      {/* ============ community identity ============ */}
      <Card className="overflow-hidden">
        <div className="relative h-24 overflow-hidden sm:h-28">
          <div className="absolute inset-0" style={{ background: accentGradient(community.accent) }} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(6,8,15,.4))]" />
          <div className="absolute inset-0 opacity-25" aria-hidden
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,.5) 1px, transparent 1.6px)",
              backgroundSize: "24px 24px",
              maskImage: "linear-gradient(100deg, transparent 55%, black 95%)",
            }}
          />
        </div>
        <div className="px-5 pt-5 pb-5 sm:px-7">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span
                className="flex size-14 shrink-0 items-center justify-center rounded-[16px] text-white"
                style={{ background: accentGradient(community.accent), boxShadow: "inset 0 1px 1px rgba(255,255,255,.3), 0 4px 12px -4px rgba(0,0,0,.2)" }}
              >
                <Users size={22} />
              </span>
              <div>
                <h1 className="track-heading text-[20px] font-semibold text-ink">{community.name}</h1>
                <p className="text-[12.5px] text-ink-3">{community.tagline}</p>
              </div>
            </div>
            <JoinCommunityButton communityId={community.id} initial={community.joined} slug={community.slug} />
          </div>

          {/* community health */}
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-4 text-[12px] text-ink-2">
            <span className="flex items-center gap-2">
              <span className="flex items-end gap-[3px]" title="Discussion pulse">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span 
                    key={i} 
                    className={cn(
                      "w-[3px] rounded-full transition-all duration-500", 
                      i < pulseLevel 
                        ? "bg-signal shadow-[0_0_8px_rgba(61,218,180,0.4)]" 
                        : "bg-ink/10"
                    )} 
                    style={{ height: 5 + i * 2.5 }} 
                  />
                ))}
              </span>
              <span className={cn("transition-colors", pulseLevel > 0 ? "text-signal font-medium" : "")}>
                {community.weeklyPosts} discussions this week
              </span>
            </span>
            <span className="tnum">{community.memberCount} members</span>
            <Chip>{community.category}</Chip>
            {community.myRole && community.myRole !== "member" ? (
              <Chip active className="capitalize">{community.myRole}</Chip>
            ) : null}
          </div>

          {/* tabs */}
          <div className="no-scrollbar mt-4 flex gap-1 overflow-x-auto border-b border-line">
            {TABS.map((t) => (
              <Link
                key={t.key}
                href={`/communities/${slug}?tab=${t.key}`}
                className={cn(
                  "relative px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors",
                  tab === t.key ? "text-ink" : "text-ink-3 hover:text-ink"
                )}
              >
                {t.label}
                {tab === t.key ? (
                  <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-[linear-gradient(90deg,var(--c-acc),var(--c-acc-3))]" />
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      </Card>

      {/* ============ tab content ============ */}
      {tab === "discussions" ? <Discussions viewerId={viewer.id} communityId={community.id} viewer={viewer} /> : null}
      {tab === "knowledge" ? <Knowledge viewerId={viewer.id} communityId={community.id} /> : null}
      {tab === "members" ? <Members communityId={community.id} /> : null}
      {tab === "events" ? <Events communityId={community.id} communitySlug={slug} /> : null}
      {tab === "about" ? (
        <Card className="p-5 sm:p-7">
          <SectionTitle>About this space</SectionTitle>
          <p className="max-w-2xl text-[13.5px] leading-relaxed text-ink-2">{community.description}</p>
        </Card>
      ) : null}
    </div>
  );
}

type ViewerLite = { id: string; name: string; accent: string; avatarUrl: string | null; roles: string[] };

async function Discussions({ viewerId, communityId, viewer }: { viewerId: string; communityId: string; viewer: ViewerLite }) {
  const posts = await listFeed({ id: viewerId } as never, { communityId });
  return (
    <div className="space-y-4">
      <QuickComposer
        name={viewer.name}
        accent={viewer.accent}
        avatarUrl={viewer.avatarUrl}
        roles={viewer.roles}
        communityId={communityId}
        placeholder="Start a discussion in this space…"
      />
      {posts.map((post) => (
        <PostCard key={post.id} post={post} viewerId={viewerId} />
      ))}
      {!posts.length ? (
        <Card>
          <EmptyState compact title="No discussions yet" body="Be the one who starts the conversation." />
        </Card>
      ) : null}
    </div>
  );
}

async function Knowledge({ viewerId, communityId }: { viewerId: string; communityId: string }) {
  const viewer = { id: viewerId } as never;
  const [articles, research] = await Promise.all([
    listFeed(viewer, { communityId, kind: "article" }),
    listFeed(viewer, { communityId, kind: "research" }),
  ]);
  const all = [...articles, ...research].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  return (
    <div className="space-y-4">
      {all.map((post) => (
        <PostCard key={post.id} post={post} viewerId={viewerId} />
      ))}
      {!all.length ? (
        <Card>
          <EmptyState compact title="The knowledge shelf is empty" body="Articles and research updates shared here become the community's living library." />
        </Card>
      ) : null}
    </div>
  );
}

async function Members({ communityId }: { communityId: string }) {
  const members = await listCommunityMembers(communityId);
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((m) => (
        <Card key={m.id} hover className="flex items-center gap-3.5 p-4">
          <Link href={`/u/${m.username}`} className="shrink-0">
            <Avatar name={m.name} accent={m.accent} avatarUrl={m.avatarUrl} roles={m.roles} size={46} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink">
              <Link href={`/u/${m.username}`} className="truncate hover:underline">{m.name}</Link>
              <RoleBadge roles={m.roles} size={15} />
            </p>
            <p className="truncate text-[11.5px] text-ink-3">{m.headline || `@${m.username}`}</p>
          </div>
          {m.memberRole !== "member" ? <Chip active className="capitalize">{m.memberRole}</Chip> : null}
        </Card>
      ))}
    </div>
  );
}

async function Events({ communityId, communitySlug }: { communityId: string; communitySlug: string }) {
  const events = await listEvents({ id: "" } as never, communityId);
  void communitySlug;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {events.map((e) => (
        <Card key={e.id} hover className="p-4.5">
          <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.1em] text-ink-3 uppercase">
            <CalendarDays size={12} className="text-acc" /> {fmtDateTime(e.startsAt)}
          </p>
          <h3 className="track-heading mt-2 text-[15px] font-semibold text-ink">{e.title}</h3>
          {e.description ? <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink-2">{e.description}</p> : null}
          <p className="mt-3 flex items-center gap-1.5 text-[12px] text-ink-3">
            {e.online ? <Globe2 size={12.5} className="text-acc-3" /> : <MapPin size={12.5} className="text-acc-3" />}
            {e.online ? "Online" : e.location}
          </p>
        </Card>
      ))}
      {!events.length ? (
        <Card className="sm:col-span-2">
          <EmptyState compact title="No upcoming events" body="When this community schedules something, it appears here." />
        </Card>
      ) : null}
    </div>
  );
}
