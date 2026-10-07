import Link from "next/link";
import type { Metadata } from "next";
import { BackHome } from "@/components/pi/back-home";
import { getViewer } from "@/server/session";
import { listOpportunities } from "@/server/services/misc";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { EmptyState } from "@/components/pi/primitives";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Careers" };

const KINDS = [
  { key: "all", label: "All" },
  { key: "job", label: "Jobs" },
  { key: "internship", label: "Internships" },
  { key: "scholarship", label: "Scholarships" },
  { key: "grant", label: "Grants" },
  { key: "conference", label: "Conferences" },
];

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind = "all" } = await searchParams;
  const viewer = (await getViewer())!;
  const opportunities = await listOpportunities(viewer, kind);
  const sorted = [...opportunities].sort((a, b) => b.match - a.match);

  return (
    <div className="anim-in-up">
      <BackHome compact />
      <header className="mb-5">
        <h1 className="track-heading text-[22px] font-semibold text-ink">Careers & Grants</h1>
        <p className="mt-1 text-[13px] text-ink-2">
          Jobs, scholarships, grants and conferences — ranked by your interest graph.
        </p>
      </header>

      <div className="no-scrollbar mb-5 flex gap-1.5 overflow-x-auto pb-0.5">
        {KINDS.map((k) => (
          <Link
            key={k.key}
            href={`/opportunities?kind=${k.key}`}
            className={cn(
              "press rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium whitespace-nowrap",
              kind === k.key
                ? "border-[color-mix(in_oklab,var(--c-acc)_50%,transparent)] bg-[color-mix(in_oklab,var(--c-acc)_12%,transparent)] text-ink"
                : "border-line text-ink-2 hover:text-ink"
            )}
          >
            {k.label}
          </Link>
        ))}
      </div>

      {sorted.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {sorted.map((opp, i) => (
            <div key={opp.id} className="anim-in-up" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
              <OpportunityCard opp={opp} />
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-2 rounded-2xl">
          <EmptyState
            title="No opportunities in this category right now"
            body="PI keeps looking. New matches appear here as institutions publish them."
          />
        </div>
      )}
    </div>
  );
}
