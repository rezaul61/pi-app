"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Globe2, GraduationCap, Layers3, MapPinned, Sparkles, Users } from "lucide-react";
import { Avatar } from "@/components/pi/avatar";
import { RoleBadge } from "@/components/pi/badge";
import { PiOrb } from "@/components/pi/orb";
import { Card, SectionTitle } from "@/components/pi/primitives";
import { AcceptButtons, ConnectButton, MessageButton } from "@/components/people/person-actions";
import { roleLabel, cn } from "@/lib/utils";
import type { PersonCard } from "@/server/services/people";

type Orbiter = PersonCard & { _angle: number };

type FilterKey = "all" | "profession" | "university" | "country" | "division";

function countryOf(location: string) {
  const parts = location.split(",").map((p) => p.trim()).filter(Boolean);
  return parts[parts.length - 1] || "Unknown";
}

function divisionOf(location: string) {
  const parts = location.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) return parts[parts.length - 2];
  if (parts.length >= 2) return parts[0];
  return parts[0] || "Unknown";
}

function clusterKey(filter: FilterKey, person: PersonCard) {
  if (filter === "profession") return roleLabel(person.roles[0]);
  if (filter === "university") return person.institution || "Independent";
  if (filter === "country") return countryOf(person.location);
  if (filter === "division") return divisionOf(person.location);
  return "Connections";
}

const FILTERS: Array<{ key: FilterKey; label: string; icon: React.ElementType }> = [
  { key: "all", label: "All", icon: Sparkles },
  { key: "profession", label: "Profession", icon: Users },
  { key: "university", label: "University", icon: GraduationCap },
  { key: "country", label: "Country", icon: Globe2 },
  { key: "division", label: "Division", icon: Layers3 },
];

export function NetworkPulseClient({
  viewer,
  connections,
  requests,
  suggestions,
  stats,
}: {
  viewer: { id: string; name: string; username: string; accent: string; avatarUrl: string | null; roles: string[] };
  connections: PersonCard[];
  requests: PersonCard[];
  suggestions: PersonCard[];
  stats: { connections: number; communities: number; institutions: number; savedOpps: number };
}) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const visConnections = useMemo(
    () =>
      connections.slice(0, 18).map((c, i, arr) => ({
        ...c,
        _angle: (i / Math.max(arr.length, 1)) * Math.PI * 2 - Math.PI / 2,
      })),
    [connections]
  );

  const groups = useMemo(() => {
    const grouped = visConnections.reduce<Record<string, Orbiter[]>>((acc, c) => {
      const key = clusterKey(filter, c);
      (acc[key] ??= []).push(c);
      return acc;
    }, {});
    return Object.entries(grouped).slice(0, 8);
  }, [filter, visConnections]);

  return (
    <div className="space-y-6">
      <Card className="glass-3 relative overflow-hidden">
        {/* Filter tabs — top, horizontally scrollable, separate from viz */}
        <div className="flex items-center justify-between gap-4 px-6 pt-5 sm:px-8">
          <p className="text-[10.5px] font-semibold tracking-[0.2em] text-ink-3 uppercase shrink-0">Network Pulse</p>
          <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-2xl bg-s1 p-1">
            {FILTERS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  "press flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-[10.5px] font-semibold whitespace-nowrap transition-all",
                  filter === key
                    ? "bg-acc text-white shadow-sm"
                    : "text-ink-3 hover:text-ink-2 hover:bg-s2"
                )}
              >
                <Icon size={11} /> {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 p-6 sm:p-8 lg:grid-cols-[360px_1fr] lg:items-center">
          {/* ==================================================== visualization */}
          <div className="relative mx-auto aspect-square w-full max-w-[280px] sm:max-w-[330px]">
            {/* Premium layered gradient behind the visualization */}
            <div className="absolute -inset-4 rounded-[40px] opacity-90"
              style={{
                background: `
                  radial-gradient(60% 55% at 50% 48%, color-mix(in oklab, var(--c-acc) 12%, transparent), transparent 70%),
                  radial-gradient(45% 40% at 30% 30%, color-mix(in oklab, var(--c-acc-3) 8%, transparent), transparent 65%),
                  radial-gradient(50% 45% at 70% 65%, color-mix(in oklab, var(--c-acc-2) 6%, transparent), transparent 60%),
                  radial-gradient(80% 80% at 50% 50%, color-mix(in oklab, var(--c-bg) 60%, var(--c-acc) 4%), transparent 80%)
                `,
              }}
            />
            <div className="absolute inset-0 rounded-full border border-line/90" />
            <div className="absolute inset-[13%] rounded-full border border-line/80" />
            <div className="absolute inset-[28%] rounded-full border border-line-2/80" />
            <div className="absolute inset-[28%] anim-pulse-ring rounded-full border border-[color-mix(in_oklab,var(--c-acc)_36%,transparent)]" />

            {/* center viewer — no extra logos */}
            <div className="absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
              <Avatar
                name={viewer.name}
                accent={viewer.accent}
                avatarUrl={viewer.avatarUrl}
                roles={viewer.roles}
                size={72}
                showBadge={false}
              />
            </div>

            {/* geometry lines */}
            <svg className="absolute inset-0 h-full w-full pointer-events-none" style={{ zIndex: 0 }}>
              {filter === "all"
                ? visConnections.map((c, i) => {
                    const ringRadius = i % 3 === 0 ? 49 : i % 3 === 1 ? 39 : 29;
                    const x = 50 + ringRadius * Math.cos(c._angle);
                    const y = 50 + ringRadius * Math.sin(c._angle);
                    return (
                      <g key={`g-${c.id}`}>
                        <line
                          x1="50%"
                          y1="50%"
                          x2={`${x}%`}
                          y2={`${y}%`}
                          stroke="color-mix(in oklab, var(--c-acc) 24%, transparent)"
                          strokeWidth="1"
                          strokeDasharray="3 4"
                        />
                      </g>
                    );
                  })
                : groups.map(([_, members], gIdx) => {
                    const groupAngle = (gIdx / Math.max(groups.length, 1)) * Math.PI * 2 - Math.PI / 2;
                    const cx = 50 + 42 * Math.cos(groupAngle);
                    const cy = 50 + 42 * Math.sin(groupAngle);
                    return (
                      <g key={`line-${gIdx}`}>
                        <line
                          x1="50%"
                          y1="50%"
                          x2={`${cx}%`}
                          y2={`${cy}%`}
                          stroke="color-mix(in oklab, var(--c-acc-3) 32%, transparent)"
                          strokeWidth="1.5"
                        />
                        <circle cx={`${cx}%`} cy={`${cy}%`} r="3" fill="color-mix(in oklab, var(--c-acc-3) 65%, white)" />
                      </g>
                    );
                  })}
            </svg>

            {/* orbiters / clusters */}
            {filter === "all"
              ? visConnections.map((c, i) => {
                  const ringRadius = i % 3 === 0 ? 49 : i % 3 === 1 ? 39 : 29;
                  const x = 50 + ringRadius * Math.cos(c._angle);
                  const y = 50 + ringRadius * Math.sin(c._angle);
                  return (
                    <Link
                      key={c.id}
                      href={`/u/${c.username}`}
                      title={`${c.name} • ${roleLabel(c.roles[0])}`}
                      className="anim-node press absolute z-20"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: "translate(-50%, -50%)",
                        animationDelay: `${160 + i * 70}ms`,
                      }}
                    >
                      <Avatar name={c.name} accent={c.accent} avatarUrl={c.avatarUrl} roles={c.roles} size={36} showBadge={false} />
                    </Link>
                  );
                })
              : groups.map(([groupName, members], gIdx) => {
                  const groupAngle = (gIdx / Math.max(groups.length, 1)) * Math.PI * 2 - Math.PI / 2;
                  const cx = 50 + 42 * Math.cos(groupAngle);
                  const cy = 50 + 42 * Math.sin(groupAngle);
                  return (
                    <div
                      key={groupName}
                      className="absolute z-20"
                      style={{ left: `${cx}%`, top: `${cy}%`, transform: "translate(-50%, -50%)" }}
                    >
                      <div className="relative">
                        <div className="absolute -inset-3 rounded-full border border-[color-mix(in_oklab,var(--c-acc-3)_18%,transparent)]" />
                        {members.map((c, i) => {
                          const r = members.length === 1 ? 0 : members.length === 2 ? 18 : 24;
                          const a = (i / members.length) * Math.PI * 2;
                          return (
                            <Link
                              key={c.id}
                              href={`/u/${c.username}`}
                              title={`${c.name} • ${groupName}`}
                              className="anim-node press absolute"
                              style={{
                                left: r * Math.cos(a),
                                top: r * Math.sin(a),
                                transform: "translate(-50%, -50%)",
                                animationDelay: `${180 + (gIdx * 4 + i) * 55}ms`,
                              }}
                            >
                              <Avatar name={c.name} accent={c.accent} avatarUrl={c.avatarUrl} roles={c.roles} size={30} showBadge={false} />
                            </Link>
                          );
                        })}
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[color-mix(in_oklab,var(--c-acc-3)_24%,transparent)] bg-[color-mix(in_oklab,var(--c-bg)_86%,transparent)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink-2 backdrop-blur shadow-sm">
                          {groupName}
                        </span>
                      </div>
                    </div>
                  );
                })}
          </div>

          {/* ==================================================== controls / stats */}
          <div>
            <h1 className="track-heading text-[22px] font-semibold text-ink">
              {stats.connections} people
              <span className="text-ink-3 font-normal"> in your verified orbit</span>
            </h1>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {[
                { label: "Connections", value: stats.connections, href: "#connections", delay: 300 },
                { label: "Communities", value: stats.communities, href: "/communities", delay: 420 },
                { label: "Institutions", value: stats.institutions, href: "/communities", delay: 540 },
                { label: "Saved opportunities", value: stats.savedOpps, href: "/opportunities", delay: 660 },
              ].map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  className="anim-node glass-1 hover-lift rounded-2xl p-3.5"
                  style={{ animationDelay: `${s.delay}ms` }}
                >
                  <p className="tnum text-xl font-semibold text-ink">{s.value}</p>
                  <p className="mt-0.5 text-[11.5px] text-ink-3">{s.label}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {requests.length ? (
        <section>
          <SectionTitle hint={`${requests.length} pending`}>Connection requests</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {requests.map((r) => (
              <Card key={r.id} className="flex items-center gap-3.5 p-4">
                <Link href={`/u/${r.username}`} className="shrink-0">
                  <Avatar name={r.name} accent={r.accent} avatarUrl={r.avatarUrl} roles={r.roles} size={44} showBadge={false} />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink">
                    <Link href={`/u/${r.username}`} className="truncate hover:underline">{r.name}</Link>
                    <RoleBadge roles={r.roles} size={15} />
                  </p>
                  <p className="text-[11.5px] text-ink-3">{roleLabel(r.roles[0])}</p>
                </div>
                <AcceptButtons requesterId={r.id} />
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {suggestions.length ? (
        <section>
          <SectionTitle>People you may know</SectionTitle>
          <div className="space-y-2.5">
            {suggestions.map((s) => (
              <Card key={s.id} className="flex items-center gap-3.5 p-3.5">
                <Link href={`/u/${s.username}`} className="shrink-0">
                  <Avatar name={s.name} accent={s.accent} avatarUrl={s.avatarUrl} roles={s.roles} size={44} showBadge={false} />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink">
                    <Link href={`/u/${s.username}`} className="truncate hover:underline">{s.name}</Link>
                    <RoleBadge roles={s.roles} size={15} />
                  </p>
                  <p className="text-[11.5px] text-ink-3">{roleLabel(s.roles[0])}</p>
                </div>
                <ConnectButton targetId={s.id} initial="none" />
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section id="connections">
        <SectionTitle hint={`${connections.length}`}>Your connections</SectionTitle>
        {connections.length ? (
          <div className="space-y-2.5">
            {connections.map((c) => (
              <Card key={c.id} className="flex items-center gap-3.5 p-3.5">
                <Link href={`/u/${c.username}`} className="shrink-0">
                  <Avatar name={c.name} accent={c.accent} avatarUrl={c.avatarUrl} roles={c.roles} size={44} showBadge={false} />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink">
                    <Link href={`/u/${c.username}`} className="truncate hover:underline">{c.name}</Link>
                    <RoleBadge roles={c.roles} size={15} />
                  </p>
                  <p className="text-[11.5px] text-ink-3">{roleLabel(c.roles[0])}</p>
                </div>
                <MessageButton targetId={c.id} label="" />
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="p-10 text-center text-[13px] text-ink-3">
              No connections yet. Start with someone you know — or accept a request.
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
