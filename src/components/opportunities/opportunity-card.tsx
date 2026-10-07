"use client";

import { useState, useTransition } from "react";
import {
  Banknote,
  Bookmark,
  CalendarClock,
  ChevronDown,
  Globe2,
  MapPin,
  Sparkles,
} from "lucide-react";
import type { Opportunity } from "@/server/services/misc";
import { Button, Chip } from "@/components/pi/primitives";
import { saveOpportunityAction } from "@/server/actions/engagement";
import { useToast } from "@/components/pi/toast";
import { cn, daysUntil } from "@/lib/utils";

const KIND_LABEL: Record<string, string> = {
  job: "Job",
  scholarship: "Scholarship",
  conference: "Conference",
  grant: "Grant",
  internship: "Internship",
};

export function OpportunityCard({ opp }: { opp: Opportunity }) {
  const [saved, setSaved] = useState(opp.saved);
  const [whyOpen, setWhyOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const days = daysUntil(opp.deadline);
  const urgent = days !== null && days <= 14 && days >= 0;

  const R = 17;
  const CIRC = 2 * Math.PI * R;

  return (
    <article className="glass-2 hover-lift rounded-2xl p-5">
      <div className="flex items-start gap-4">
        {/* match ring */}
        <div className="relative shrink-0" title={`PI Match — ${opp.match}%`}>
          <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
            <circle cx="24" cy="24" r={R} fill="none" stroke="var(--c-line)" strokeWidth="3.5" />
            <circle
              cx="24" cy="24" r={R} fill="none"
              stroke={opp.match >= 75 ? "var(--c-signal)" : "var(--c-acc)"}
              strokeWidth="3.5" strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - opp.match / 100)}
              style={{ transition: "stroke-dashoffset 800ms var(--ease-pi)" }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10.5px] font-bold text-ink tnum">
            {opp.match}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Chip active>{KIND_LABEL[opp.kind] ?? opp.kind}</Chip>
            {urgent ? <Chip className="text-warn border-[color-mix(in_oklab,var(--c-warn)_40%,transparent)]">Closing soon</Chip> : null}
          </div>
          <h3 className="track-heading mt-2 text-[16px] font-semibold text-ink">{opp.title}</h3>
          <p className="text-[12.5px] font-medium text-ink-2">{opp.org}</p>
          {opp.description ? (
            <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink-2">{opp.description}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-2">
        <span className="flex items-center gap-1.5">
          {opp.remote ? <Globe2 size={13} className="text-acc-3" /> : <MapPin size={13} className="text-acc-3" />}
          {opp.remote ? "Remote" : opp.location || "Location flexible"}
        </span>
        {opp.funding ? (
          <span className="flex items-center gap-1.5"><Banknote size={13} className="text-signal" /> {opp.funding}</span>
        ) : null}
        {opp.deadline ? (
          <span className={cn("flex items-center gap-1.5", urgent && "font-medium text-warn")}>
            <CalendarClock size={13} />
            {days !== null && days >= 0 ? `${days} days left` : "Deadline passed"}
          </span>
        ) : null}
      </div>

      {opp.eligibility.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {opp.eligibility.slice(0, 4).map((e) => (
            <Chip key={e}>{e}</Chip>
          ))}
        </div>
      ) : null}

      {/* why this matches you — honest, derived reasons */}
      <button
        onClick={() => setWhyOpen((o) => !o)}
        className="press mt-4 flex cursor-pointer items-center gap-1.5 text-[12.5px] font-medium text-acc"
      >
        <Sparkles size={13} />
        Why this matches you
        <ChevronDown size={13} className={cn("transition-transform duration-300", whyOpen && "rotate-180")} />
      </button>
      {whyOpen ? (
        <ul className="anim-in mt-2.5 space-y-1.5 rounded-xl glass-1 p-3.5">
          {opp.why.map((w) => (
            <li key={w} className="flex items-start gap-2 text-[12.5px] text-ink-2">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-signal" />
              {w}
            </li>
          ))}
          <li className="pt-1 text-[10.5px] text-ink-3">
            Match is computed from your interest graph and role — never from guessed data.
          </li>
        </ul>
      ) : null}

      <div className="mt-4 flex items-center gap-2.5 border-t border-line pt-4">
        <Button
          size="sm"
          onClick={() => opp.applyUrl && window.open(opp.applyUrl, "_blank", "noreferrer")}
          disabled={!opp.applyUrl}
        >
          {opp.kind === "conference" ? "Register" : "Apply"} ↗
        </Button>
        <button
          onClick={() =>
            startTransition(async () => {
              const res = await saveOpportunityAction(opp.id);
              setSaved(res.saved);
              toast(res.saved ? "Saved to your opportunities" : "Removed from saved", "info");
            })
          }
          disabled={pending}
          aria-label={saved ? "Unsave" : "Save"}
          className={cn(
            "press ml-auto flex size-9 cursor-pointer items-center justify-center rounded-xl",
            saved ? "text-acc" : "text-ink-3 hover:bg-s2 hover:text-ink"
          )}
        >
          <Bookmark size={16} strokeWidth={1.8} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
    </article>
  );
}
