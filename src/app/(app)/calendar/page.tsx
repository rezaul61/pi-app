import { BackHome } from "@/components/pi/back-home";
import Link from "next/link";
import type { Metadata } from "next";
import { CalendarClock, CalendarDays, Globe2, MapPin } from "lucide-react";
import { getViewer } from "@/server/session";
import { calendarAgenda } from "@/server/services/dashboard";
import { Card, Chip, EmptyState } from "@/components/pi/primitives";
import { fmtDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "PI Calendar" };

function groupLabel(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default async function CalendarPage() {
  const viewer = (await getViewer())!;
  const agenda = await calendarAgenda(viewer);
  const groups = agenda.reduce<Record<string, typeof agenda>>((acc, item) => {
    (acc[groupLabel(item.date)] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="anim-in-up mx-auto max-w-4xl">
      <BackHome compact />
      <header className="mb-5">
        <h1 className="track-heading text-[22px] font-semibold text-ink">PI Calendar</h1>
        <p className="mt-1 text-[13px] text-ink-2">
          Deadlines, conferences, scholarships, jobs, and community events in one intelligent timeline.
        </p>
      </header>

      {agenda.length ? (
        <div className="space-y-6">
          {Object.entries(groups).map(([label, items]) => (
            <section key={label}>
              <p className="mb-2 text-[10.5px] font-semibold tracking-[0.16em] text-ink-3 uppercase">{label}</p>
              <div className="space-y-3">
                {items.map((item) => (
                  <Card key={`${item.kind}-${item.id}`} hover className="p-4.5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Chip active>{item.kind === "event" ? "Event" : "Deadline"}</Chip>
                          {item.urgency === "soon" ? <Chip className="text-warn border-[color-mix(in_oklab,var(--c-warn)_40%,transparent)]">Soon</Chip> : null}
                        </div>
                        <Link href={item.href} className="track-heading block text-[16px] font-semibold text-ink hover:underline">
                          {item.title}
                        </Link>
                        <p className="mt-0.5 text-[12px] text-ink-3">{item.subtitle}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-2">
                          <span className="flex items-center gap-1.5"><CalendarClock size={13} className="text-acc" /> {fmtDateTime(item.date)}</span>
                          <span className="flex items-center gap-1.5">
                            {item.location === "Online" || item.location === "Remote / online" ? <Globe2 size={13} className="text-acc-3" /> : <MapPin size={13} className="text-acc-3" />}
                            {item.location}
                          </span>
                        </div>
                      </div>
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl aurora-surface text-white">
                        <CalendarDays size={18} />
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState title="Your calendar is clear" body="When PI finds deadlines and events that matter to you, they gather here." />
        </Card>
      )}
    </div>
  );
}
