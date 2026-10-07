"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Bell, Compass, MessageCircle, MessagesSquare, ShieldCheck, UserPlus } from "lucide-react";
import { Avatar } from "@/components/pi/avatar";
import { Card, EmptyState } from "@/components/pi/primitives";
import { MarkRead } from "@/components/pi/mark-read";
import { PiOrb } from "@/components/pi/orb";
import { PreviewModal, type PreviewData } from "@/components/pi/preview-modal";
import { cn, timeAgo } from "@/lib/utils";

const TYPE_ICON: Record<string, React.ElementType> = {
  connection_request: UserPlus,
  connection_accepted: UserPlus,
  comment: MessagesSquare,
  message: MessageCircle,
  verify: ShieldCheck,
  system: Bell,
  opportunity_alert: Compass,
};

function NotifRow({ n, onLongPress }: { n: any; onLongPress: (n: any) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);
  const Icon = TYPE_ICON[n.type] ?? Bell;

  const startPress = () => {
    fired.current = false;
    timerRef.current = setTimeout(() => {
      fired.current = true;
      onLongPress(n);
    }, 700);
  };

  const cancelPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <Link
      href={n.href}
      onClick={(e) => { if (fired.current) e.preventDefault(); }}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchCancel={cancelPress}
      className={cn(
        "flex w-full items-start gap-3.5 px-4.5 py-3.5 transition-colors hover:bg-s2 select-none cursor-pointer",
        !n.readAt && "bg-[color-mix(in_oklab,var(--c-acc)_5%,transparent)]"
      )}
    >
      {n.actor ? (
        <Avatar name={n.actor.name} accent={n.actor.accent} avatarUrl={n.actor.avatarUrl} size={40} showBadge={false} />
      ) : (
        <PiOrb size={40} state="idle" />
      )}
      <span className="min-w-0 flex-1 pt-0.5">
        <span className="block text-[13.5px] leading-snug text-ink">{n.body}</span>
        <span className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-3">
          <Icon size={11} /> {timeAgo(n.createdAt)}
        </span>
      </span>
      {!n.readAt ? <span className="mt-2 size-2 shrink-0 rounded-full bg-acc" /> : null}
    </Link>
  );
}

export default function NotificationsPage({ notifications }: { notifications: any[] }) {
  const [preview, setPreview] = useState<PreviewData | null>(null);

  const today = notifications.filter((n) => Date.now() - +new Date(n.createdAt) < 86400000);
  const earlier = notifications.filter((n) => Date.now() - +new Date(n.createdAt) >= 86400000);

  const handleLongPress = (n: any) => {
    setPreview({
      type: "notification",
      content: n.body,
      timestamp: n.createdAt,
      actor: n.actor
        ? { id: n.actor.id, name: n.actor.name, username: n.actor.username, avatarUrl: n.actor.avatarUrl, roles: n.actor.roles || ["professional"] }
        : { name: "PI", username: "system", avatarUrl: null, roles: ["institution"] },
      meta: { type: n.type, href: n.href },
    });
  };

  return (
    <div className="anim-in-up mx-auto max-w-2xl">
      <MarkRead />
      <PreviewModal open={!!preview} onClose={() => setPreview(null)} data={preview} />

      <header className="mb-5">
        <h1 className="track-heading text-[22px] font-semibold text-ink">Notifications</h1>
        <p className="mt-1 text-[13px] text-ink-2">
          Signal, not noise. PI only surfaces what matters. <span className="text-ink-3">Hold any notification to preview.</span>
        </p>
      </header>

      {notifications.length ? (
        <div className="space-y-6">
          {[{ label: "New", items: today }, { label: "Earlier", items: earlier }]
            .filter((g) => g.items.length)
            .map((group) => (
              <section key={group.label}>
                <p className="mb-2 text-[10.5px] font-semibold tracking-[0.16em] text-ink-3 uppercase">{group.label}</p>
                <Card className="divide-y divide-[var(--c-line)] overflow-hidden">
                  {group.items.map((n: any) => (
                    <NotifRow key={n.id} n={n} onLongPress={handleLongPress} />
                  ))}
                </Card>
              </section>
            ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="All caught up"
            body="When your network moves — connections, comments, messages — you'll see it here first."
          />
        </Card>
      )}
    </div>
  );
}
