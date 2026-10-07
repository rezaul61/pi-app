import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getViewer } from "@/server/session";
import { listFeed } from "@/server/services/feed";
import { listCommunities } from "@/server/services/communities";
import { topOpportunities } from "@/server/services/misc";
import { PostCard } from "@/components/post/post-card";
import { QuickComposer } from "@/components/post/quick-composer";
import { Greeting } from "@/components/pi/greeting";
import { Card, Chip, EmptyState, SectionTitle } from "@/components/pi/primitives";
import { MoodSwitcher } from "@/components/pi/mood-switcher";
import { JoinCommunityButton } from "@/components/people/person-actions";
import { accentGradient } from "@/lib/utils";



export default async function HomePage() {
  const viewer = (await getViewer())!;
  const [feed, opportunities, communities] = await Promise.all([
    listFeed(viewer),
    topOpportunities(viewer),
    listCommunities(viewer),
  ]);
  const suggested = communities.filter((c) => !c.joined).slice(0, 2);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_312px]">
      {/* ============ feed column ============ */}
      <div className="min-w-0">
        <header className="anim-in mb-5">
          <Greeting name={viewer.name} />
          <div className="mt-1">
            <MoodSwitcher goals={viewer.goals} />
          </div>
        </header>

        <div className="anim-in-up mb-5">
          <QuickComposer
            name={viewer.name}
            accent={viewer.accent}
            avatarUrl={viewer.avatarUrl}
            roles={viewer.roles}
          />
        </div>

        <div className="space-y-4">
          {feed.map((post, i) => (
            <div key={post.id} className="anim-in-up" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
              <PostCard post={post} viewerId={viewer.id} />
            </div>
          ))}
          {!feed.length ? (
            <Card>
              <EmptyState
                title="Your network is still quiet"
                body="Connect with researchers and join communities — the feed becomes yours."
                action={
                  <Link href="/network" className="text-[13px] font-medium text-acc pi-link">
                    Grow your network
                  </Link>
                }
              />
            </Card>
          ) : null}
        </div>
      </div>

      {/* ============ intelligence rail ============ */}
      <aside className="hidden space-y-4 lg:block">
        <Card className="anim-in-up overflow-hidden" >
          <div className="aurora-line opacity-70" />
          <div className="p-4.5">
            <SectionTitle hint="PI Match">Careers aligned to you</SectionTitle>
            <div className="space-y-3">
              {opportunities.slice(0, 2).map((o) => (
                <Link key={o.id} href="/opportunities" className="group block rounded-xl border border-line p-3 transition-colors hover:border-line-2 hover:bg-s1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10.5px] font-semibold tracking-[0.12em] text-ink-3 uppercase">{o.kind}</span>
                    <span className="tnum text-[11px] font-semibold text-signal">{o.match}% match</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-snug font-medium text-ink group-hover:underline">{o.title}</p>
                  <p className="mt-0.5 text-[11.5px] text-ink-3">{o.org}</p>
                </Link>
              ))}
            </div>
            <Link href="/opportunities" className="mt-3.5 flex items-center gap-1 text-[12px] font-medium text-acc pi-link w-fit">
              All careers <ArrowUpRight size={12} />
            </Link>
          </div>
        </Card>

        {suggested.length ? (
          <Card className="anim-in-up p-4.5" >
            <SectionTitle>Communities for you</SectionTitle>
            <div className="space-y-3.5">
              {suggested.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="size-10 shrink-0 rounded-[12px]" style={{ background: accentGradient(c.accent) }} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/communities/${c.slug}`} className="block truncate text-[13px] font-semibold text-ink hover:underline">
                      {c.name}
                    </Link>
                    <p className="truncate text-[11.5px] text-ink-3">{c.memberCount} members</p>
                  </div>
                  <JoinCommunityButton communityId={c.id} initial={false} slug={c.slug} />
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        <p className="px-2 text-center text-[10.5px] tracking-[0.18em] text-ink-3 select-none">
          π = 3.14159 26535 89793…
        </p>
      </aside>
    </div>
  );
}
