"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Briefcase,
  ChartColumn,
  FileText,
  GraduationCap,
  Landmark,
  Rocket,
  Search,
  Users,
} from "lucide-react";
import { Avatar } from "./avatar";
import { PiOrb } from "./orb";
import { cn } from "@/lib/utils";

/* ============================================================
   PI Command Center — ⌘K global search with categorized,
   instantly-updating results.
   ============================================================ */

type Results = {
  people: Array<{ id: string; name: string; username: string; headline: string; isVerified: boolean; accent: string; avatarUrl: string | null }>;
  communities: Array<{ id: string; slug: string; name: string; tagline: string; members: number }>;
  research: Array<{ id: string; title: string; author: string; username: string; kind: string }>;
  projects: Array<{ id: string; title: string; author: string; username: string; kind: string }>;
  opportunities: Array<{ id: string; title: string; org: string; kind: string }>;
  institutions: Array<{ id: string; name: string; username: string; headline: string; accent: string; avatarUrl: string | null }>;
};

type Item = { key: string; href: string; icon: React.ReactNode; title: string; sub: string; group: string };

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setResults(null);
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const query = q.trim();
    if (query.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: ctrl.signal });
        const data = (await res.json()) as Results;
        setResults(data);
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 170);
    return () => window.clearTimeout(timer);
  }, [q, open]);

  const items = useMemo<Item[]>(() => {
    if (!results) return [];
    const out: Item[] = [];
    for (const p of results.people)
      out.push({
        key: `p-${p.id}`, group: "People", href: `/u/${p.username}`,
        icon: <Avatar name={p.name} accent={p.accent} avatarUrl={p.avatarUrl} size={30} showBadge={false} />,
        title: p.name, sub: p.headline || `@${p.username}`,
      });
    for (const c of results.communities)
      out.push({
        key: `c-${c.id}`, group: "Communities", href: `/communities/${c.slug}`,
        icon: <span className="flex size-[30px] items-center justify-center rounded-[10px] bg-s3 text-ink-2"><Users size={14} /></span>,
        title: c.name, sub: `${c.members} members`,
      });
    for (const r of results.research)
      out.push({
        key: `r-${r.id}`, group: "Research & Publications", href: `/post/${r.id}`,
        icon: <span className="flex size-[30px] items-center justify-center rounded-[10px] bg-s3 text-ink-2"><FileText size={14} /></span>,
        title: r.title, sub: `${r.author} · ${r.kind === "article" ? "Article" : "Research"}`,
      });
    for (const r of results.projects)
      out.push({
        key: `j-${r.id}`, group: "Projects", href: `/post/${r.id}`,
        icon: <span className="flex size-[30px] items-center justify-center rounded-[10px] bg-s3 text-ink-2"><Rocket size={14} /></span>,
        title: r.title, sub: r.author,
      });
    for (const o of results.opportunities)
      out.push({
        key: `o-${o.id}`, group: "Opportunities", href: `/opportunities`,
        icon: (
          <span className="flex size-[30px] items-center justify-center rounded-[10px] bg-s3 text-ink-2">
            {o.kind === "scholarship" ? <GraduationCap size={14} /> : o.kind === "conference" ? <ChartColumn size={14} /> : <Briefcase size={14} />}
          </span>
        ),
        title: o.title, sub: o.org,
      });
    for (const i of results.institutions)
      out.push({
        key: `i-${i.id}`, group: "Institutions", href: `/u/${i.username}`,
        icon: <Avatar name={i.name} accent={i.accent} avatarUrl={i.avatarUrl} size={30} showBadge={false} />,
        title: i.name, sub: i.headline || "Institution",
      });
    return out;
  }, [results]);

  const go = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router]
  );

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter" && items[active]) {
      go(items[active].href);
    }
  };

  if (!open) return null;

  const grouped = items.reduce<Record<string, Item[]>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});
  let flatIndex = -1;

  return (
    <div className="fixed inset-0 z-[85] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal aria-label="Command center">
      <button aria-label="Close" onClick={onClose} className="anim-fade absolute inset-0 cursor-default bg-[rgba(4,6,14,.5)] backdrop-blur-[3px]" />
      <div className="anim-scale-in glass-4 relative w-full max-w-xl overflow-hidden rounded-2xl">
        <div className="flex items-center gap-3 border-b border-line px-4.5 py-3.5">
          {loading ? <PiOrb size={22} state="searching" /> : q.trim() ? <PiOrb size={18} state="searching" /> : <Search size={17} className="shrink-0 text-ink-3" />}
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKey}
            placeholder="Search people, research, communities, opportunities…"
            className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3"
            aria-label="Search PI"
          />
          <kbd className="hidden rounded-md border border-line bg-s1 px-1.5 py-0.5 text-[10px] font-medium text-ink-3 sm:block">ESC</kbd>
        </div>

        <div className="max-h-[46vh] overflow-y-auto p-2">
          {!results && !loading ? (
            <div className="flex flex-col items-center py-10 text-center">
              <Landmark size={18} className="text-ink-3" />
              <p className="mt-3 text-[13px] text-ink-2">Search across the whole network.</p>
              <p className="mt-1 text-xs text-ink-3">People · Communities · Research · Projects · Opportunities · Institutions</p>
            </div>
          ) : null}

          {results && items.length === 0 && !loading ? (
            <p className="px-3 py-8 text-center text-[13px] text-ink-2">
              Nothing matches “{q}” yet. Try a different phrase.
            </p>
          ) : null}

          {Object.entries(grouped).map(([group, groupItems]) => (
            <div key={group} className="mb-1.5 last:mb-0">
              <p className="px-3 pt-2.5 pb-1.5 text-[10.5px] font-semibold tracking-[0.14em] text-ink-3 uppercase">{group}</p>
              {groupItems.map((item) => {
                flatIndex += 1;
                const idx = flatIndex;
                return (
                  <button
                    key={item.key}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => go(item.href)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors",
                      idx === active ? "bg-s3" : "bg-transparent"
                    )}
                  >
                    {item.icon}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-ink">{item.title}</span>
                      <span className="block truncate text-[11.5px] text-ink-3">{item.sub}</span>
                    </span>
                    {idx === active ? <ArrowRight size={14} className="shrink-0 text-ink-3" /> : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 border-t border-line px-4.5 py-2.5 text-[10.5px] text-ink-3">
          <span className="flex items-center gap-1.5"><kbd className="rounded border border-line bg-s1 px-1">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1.5"><kbd className="rounded border border-line bg-s1 px-1">↵</kbd> open</span>
        </div>
      </div>
    </div>
  );
}
