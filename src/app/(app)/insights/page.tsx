import { BackHome } from "@/components/pi/back-home";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Lightbulb, MessagesSquare, Vault } from "lucide-react";
import { getViewer } from "@/server/session";
import { piInsight } from "@/server/services/dashboard";
import { PiOrb } from "@/components/pi/orb";
import { Card, Chip, SectionTitle, Stat } from "@/components/pi/primitives";

export const metadata: Metadata = { title: "PI Insight" };

export default async function InsightsPage() {
  const viewer = (await getViewer())!;
  const insight = await piInsight(viewer);

  return (
    <div className="anim-in-up space-y-6">
      <BackHome compact />
      <Card className="glass-3 overflow-hidden">
        <div className="grid gap-5 p-6 sm:grid-cols-[auto_1fr] sm:p-7">
          <PiOrb size={84} state="analyzing" />
          <div>
            <p className="text-[10.5px] font-semibold tracking-[0.18em] text-ink-3 uppercase">PI Insight</p>
            <h1 className="track-heading mt-2 text-[24px] font-semibold text-ink">Your network is becoming more useful</h1>
            <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-ink-2">
              PI reads your verified graph, community participation, message flow, and opportunity alignment to surface where momentum is strongest.
            </p>
            <div className="mt-5 flex flex-wrap gap-6">
              <Stat value={insight.stats.connections} label="Connections" />
              <Stat value={insight.warmThreads} label="Warm threads" />
              <Stat value={insight.vaultCount} label="Vault items" />
              <Stat value={insight.incomingQuestions} label="Recent asks" />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <SectionTitle hint="last 90 days">Knowledge velocity</SectionTitle>
          <div className="space-y-3">
            {insight.postMix.length ? insight.postMix.map((item) => (
              <div key={item.kind}>
                <div className="mb-1 flex items-center justify-between text-[12.5px]">
                  <span className="capitalize text-ink">{item.kind}</span>
                  <span className="tnum text-ink-3">{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-s1">
                  <div className="h-full rounded-full [background:linear-gradient(90deg,var(--c-acc),var(--c-acc-3))]" style={{ width: `${Math.min(100, item.count * 20)}%` }} />
                </div>
              </div>
            )) : <p className="text-[12.5px] text-ink-3">You haven’t published yet — your first post will define your public signal.</p>}
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle hint="where your graph is strongest">Theme clusters</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {insight.strongestThemes.map((theme) => <Chip key={theme}>{theme}</Chip>)}
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-ink-2">
            Your current role, communities, and saved opportunities suggest your strongest network gravity is around these themes.
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-5">
          <SectionTitle hint="best current fit">Opportunity alignment</SectionTitle>
          <div className="space-y-3">
            {insight.topMatches.map((opp) => (
              <Link key={opp.id} href="/opportunities" className="group block rounded-xl border border-line p-3 transition-colors hover:border-line-2 hover:bg-s1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold tracking-[0.1em] text-ink-3 uppercase">{opp.kind}</span>
                  <span className="tnum text-[11.5px] font-semibold text-signal">{opp.match}% match</span>
                </div>
                <p className="mt-1 text-[13px] font-semibold text-ink group-hover:underline">{opp.title}</p>
                <p className="mt-0.5 text-[11.5px] text-ink-3">{opp.org}</p>
                <ul className="mt-2 space-y-1 text-[11.5px] text-ink-2">
                  {opp.why.slice(0, 2).map((why) => <li key={why}>• {why}</li>)}
                </ul>
              </Link>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <SectionTitle hint="where to invest next">Recommended moves</SectionTitle>
            <div className="space-y-3 text-[12.5px] text-ink-2">
              <div className="flex gap-3"><span className="mt-1 text-acc"><Lightbulb size={14} /></span><p>Your inbox has <span className="font-semibold text-ink">{insight.incomingQuestions}</span> recent asks. Converting even one into a useful follow-up strengthens your graph more than posting another generic update.</p></div>
              <div className="flex gap-3"><span className="mt-1 text-acc-3"><MessagesSquare size={14} /></span><p>You have <span className="font-semibold text-ink">{insight.warmThreads}</span> warm conversation threads. Those are your highest-likelihood collaboration paths right now.</p></div>
              <div className="flex gap-3"><span className="mt-1 text-signal"><Vault size={14} /></span><p>Your Vault contains <span className="font-semibold text-ink">{insight.vaultCount}</span> saved assets. Turning one saved item into a post or comment compounds its value.</p></div>
            </div>
          </Card>
          <Card className="p-5">
            <SectionTitle>Joined communities</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {insight.joinedCommunities.map((community) => (
                <Link key={community.id} href={`/communities/${community.slug}`} className="glass-1 press rounded-full px-3 py-1.5 text-[12px] text-ink-2 hover:text-ink">
                  {community.name}
                </Link>
              ))}
            </div>
            <Link href="/communities" className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-acc pi-link">
              Explore more communities <ArrowUpRight size={12} />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
