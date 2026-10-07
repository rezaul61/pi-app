import Link from "next/link";
import { Activity, Users } from "lucide-react";
import { BackHome } from "@/components/pi/back-home";
import { getViewer } from "@/server/session";
import { listCommunities } from "@/server/services/communities";
import { Card, Chip, SectionTitle } from "@/components/pi/primitives";
import { JoinCommunityButton } from "@/components/people/person-actions";
import { accentGradient, cn } from "@/lib/utils";

export default async function CommunitiesPage() {
  const viewer = (await getViewer())!;
  const communities = await listCommunities(viewer);
  const mine = communities.filter((c) => c.joined);
  const discover = communities.filter((c) => !c.joined);

  return (
    <div className="anim-in-up space-y-7">
      <BackHome compact />
      <header>
        <h1 className="track-heading text-[22px] font-semibold text-ink">Communities</h1>
        <p className="mt-1 text-[13px] text-ink-2">
          Spaces where knowledge compounds — join the ones that match your mind.
        </p>
      </header>

      {mine.length ? (
        <section>
          <SectionTitle hint={`${mine.length}`}>Your spaces</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((c, i) => (
              <CommunityTile key={c.id} community={c} index={i} />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <SectionTitle>{mine.length ? "Discover more" : "All communities"}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {discover.map((c, i) => (
            <CommunityTile key={c.id} community={c} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

function CommunityTile({
  community: c,
  index,
}: {
  community: Awaited<ReturnType<typeof listCommunities>>[number];
  index: number;
}) {
  const pulse = Math.min(5, c.weeklyPosts);
  return (
    <div className="anim-in-up" style={{ animationDelay: `${Math.min(index, 6) * 55}ms` }}>
      <Card hover className="flex h-full flex-col overflow-hidden">
        <div className="relative h-1.5 w-full" style={{ background: accentGradient(c.accent) }} />
        <div className="flex flex-1 flex-col p-4.5">
          <div className="flex items-start gap-3">
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-[13px] text-white"
              style={{ background: accentGradient(c.accent), boxShadow: "inset 0 1px 1px rgba(255,255,255,.3)" }}
            >
              <Users size={17} />
            </span>
            <div className="min-w-0">
              <Link href={`/communities/${c.slug}`} className="block truncate text-[14.5px] font-semibold text-ink hover:underline">
                {c.name}
              </Link>
              <p className="truncate text-[11.5px] text-ink-3">{c.tagline}</p>
            </div>
          </div>

          <p className="mt-3 line-clamp-2 min-h-9 text-[12.5px] leading-relaxed text-ink-2">{c.description}</p>

          <div className="mt-auto flex items-center justify-between gap-3 pt-4">
            <div className="flex items-center gap-2.5">
              <Chip>{c.category}</Chip>
              {/* discussion pulse — community health */}
              <span className="flex items-end gap-[3px]" title={`${c.weeklyPosts} discussions this week`}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "w-[3px] rounded-full transition-all duration-500",
                      i < pulse 
                        ? "bg-signal shadow-[0_0_8px_rgba(61,218,180,0.4)]" 
                        : "bg-ink/10"
                    )}
                    style={{ height: 5 + i * 2.5 }}
                  />
                ))}
                <Activity size={12} className={cn("ml-1 transition-colors", pulse > 0 ? "text-signal" : "text-ink-3")} />
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="tnum text-[11.5px] text-ink-3">{c.memberCount}</span>
              <JoinCommunityButton communityId={c.id} initial={c.joined} slug={c.slug} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
