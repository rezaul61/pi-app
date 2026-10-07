"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { ConversationSummary } from "@/server/services/messages";
import { useRef } from "react";
import { Avatar } from "@/components/pi/avatar";
import { RoleBadge } from "@/components/pi/badge";
import { PiOrb } from "@/components/pi/orb";
import { PreviewModal, type PreviewData } from "@/components/pi/preview-modal";
import { cn, timeAgo, roleLabel } from "@/lib/utils";

export function ConversationList({
  conversations,
  activeId,
}: {
  conversations: ConversationSummary[];
  activeId?: string;
}) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"all" | "unread">("all");
  const [preview, setPreview] = useState<PreviewData | null>(null);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations.filter((c) => {
      if (mode === "unread" && c.unread < 1) return false;
      if (!q) return true;
      return [c.other.name, c.other.username, c.other.headline, c.lastMessage]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [conversations, mode, query]);

  const unreadCount = conversations.reduce((n, c) => n + (c.unread ? 1 : 0), 0);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="track-heading text-[16px] font-semibold text-ink">PI Messages</h1>
          {unreadCount > 0 && (
            <button onClick={() => setMode(mode === "unread" ? "all" : "unread")}
              className={cn("press flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold cursor-pointer border", mode === "unread" ? "border-acc/50 bg-acc/10 text-acc" : "border-line text-ink-3 hover:text-ink")}>
              <span className="size-1.5 rounded-full bg-acc inline-block" /> {unreadCount} unread
            </button>
          )}
        </div>
        <div className="glass-1 flex items-center gap-2 rounded-xl px-2.5 h-8">
          {query.trim() ? <PiOrb size={14} state="searching" /> : <Search size={12} className="text-ink-3" />}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations…"
            className="w-full bg-transparent text-[11.5px] text-ink outline-none placeholder:text-ink-3"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <PreviewModal open={!!preview} onClose={() => setPreview(null)} data={preview} />
        {items.map((c) => {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const fired = useRef(false);
          const startPress = () => {
            fired.current = false;
            timerRef.current = setTimeout(() => {
              fired.current = true;
              setPreview({
                type: "message",
                content: c.lastMessage || "No messages yet.",
                timestamp: c.lastMessageAt,
                actor: { id: c.other.id, name: c.other.name, username: c.other.username, avatarUrl: c.other.avatarUrl, roles: c.other.roles },
                meta: { id: c.id, href: `/messages/${c.id}` }
              });
            }, 700);
          };
          const cancelPress = () => { if (timerRef.current) clearTimeout(timerRef.current); };
          return (
          <Link
            key={c.id}
            href={`/messages/${c.id}`}
            onClick={(e) => { if (fired.current) e.preventDefault(); }}
            onMouseDown={startPress} onMouseUp={cancelPress} onMouseLeave={cancelPress}
            onTouchStart={startPress} onTouchEnd={cancelPress} onTouchCancel={cancelPress}
            className={cn(
              "mb-1 flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors select-none",
              activeId === c.id ? "bg-s3" : "hover:bg-s2"
            )}
          >
            <Avatar name={c.other.name} accent={c.other.accent} avatarUrl={c.other.avatarUrl} roles={c.other.roles} size={44} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className={cn("truncate text-[13.5px]", c.unread ? "font-semibold text-ink" : "font-medium text-ink-2")}>
                  {c.other.name}
                </span>
                <RoleBadge roles={c.other.roles} size={15} />
              </span>
              {/* profession only — simple and useful */}
              <span className="mt-0.5 block truncate text-[11.5px] text-ink-3">
                {roleLabel(c.other.roles[0])}
              </span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
              <span className="text-[10.5px] text-ink-3 tnum">{timeAgo(c.lastMessageAt)}</span>
              {c.unread ? (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8b5cf6,#6366f1)] px-1 text-[9.5px] font-bold text-white tnum">
                  {c.unread}
                </span>
              ) : null}
            </span>
          </Link>
          );
        })}
        {!items.length ? (
          <p className="px-3 py-10 text-center text-[12.5px] text-ink-3">
            {query.trim() ? "No conversations match that search." : "No conversations yet. Open a profile and press Message."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
