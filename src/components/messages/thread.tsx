"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, CalendarDays, Copy, Search, SendHorizonal, Sparkles, Star, X, Paperclip, MapPin, Phone, Video, Smile } from "lucide-react";
import type { ImportantMsg, MessageRow, ThreadInsight } from "@/server/services/messages";
import { Avatar } from "@/components/pi/avatar";
import { RoleBadge } from "@/components/pi/badge";
import { PiOrb } from "@/components/pi/orb";
import { Button, Chip } from "@/components/pi/primitives";
import { useToast } from "@/components/pi/toast";
import { markImportantAction, sendMessageAction, unmarkImportantAction } from "@/server/actions/messages";
import { cn, fmtDate, timeAgo, roleLabel } from "@/lib/utils";

type Other = {
  id: string; name: string; username: string; headline: string;
  roles: string[]; isVerified: boolean; accent: string; avatarUrl: string | null;
  interests: string[]; institution: string; location: string;
};

function highlight(text: string, query: string) {
  if (!query.trim()) return text;
  const esc = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${esc})`, "ig"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="rounded bg-[color-mix(in_oklab,var(--c-acc)_20%,transparent)] px-0.5 text-inherit">{part}</mark>
    ) : (<span key={i}>{part}</span>)
  );
}

export function ThreadPane({
  conversationId, messages, other, viewer, insight, importantMessages, meta,
}: {
  conversationId: string;
  messages: MessageRow[];
  other: Other | null;
  viewer: { name: string; accent: string; avatarUrl: string | null };
  insight: ThreadInsight;
  importantMessages: ImportantMsg[];
  meta: { startedAt: string; lastMessageAt: string; messageCount: number; firstUnreadId: string | null };
}) {
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = useState("");
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<"thread" | "important">("thread");
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markLabel, setMarkLabel] = useState("");
  const [mentionOpen, setMentionOpen] = useState(false);
  const [attachments, setAttachments] = useState<Array<{ url: string; type: "image" | "video" | "audio" | "file" | "sticker" }>>([]);
  const [location, setLocation] = useState<{ label: string; latitude: number; longitude: number } | undefined>();
  const fileInput = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = window.setInterval(() => router.refresh(), 8000);
    return () => window.clearInterval(t);
  }, [router]);

  useEffect(() => {
    if (tab === "thread") endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, tab]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((m) => m.content.toLowerCase().includes(q));
  }, [messages, search]);

  const send = () => {
    const text = value.trim();
    if ((!text && !attachments.length && !location) || pending) return;
    setValue("");
    startTransition(async () => {
      const res = await sendMessageAction(conversationId, text, { attachments, location });
      if (!res.ok) { toast("Could not send message", "error"); setValue(text); return; }
      setAttachments([]); setLocation(undefined);
      router.refresh();
    });
  };

  const doMark = (messageId: string) => {
    const label = markLabel.trim() || "important";
    setMarkingId(null);
    setMarkLabel("");
    startTransition(async () => {
      await markImportantAction(conversationId, messageId, label);
      toast(`Marked as "${label}"`, "success");
      router.refresh();
    });
  };

  const doUnmark = (messageId: string) => {
    startTransition(async () => {
      await unmarkImportantAction(messageId);
      toast("Unmarked", "info");
      router.refresh();
    });
  };

  const copySummary = async () => {
    try { await navigator.clipboard.writeText(insight.summary); toast("Thread brief copied", "info"); }
    catch { toast("Could not copy", "error"); }
  };

  return (
    <div className="grid h-full xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex min-h-0 flex-col border-r border-line">
        {/* header */}
        {other ? (
          <div className="border-b border-line px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link href={`/u/${other.username}`}>
                <Avatar name={other.name} accent={other.accent} avatarUrl={other.avatarUrl} roles={other.roles} size={38} />
              </Link>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink">
                  <Link href={`/u/${other.username}`} className="truncate hover:underline">{other.name}</Link>
                  <RoleBadge roles={other.roles} size={15} />
                </p>
                <p className="truncate text-[11px] text-ink-3">{roleLabel(other.roles[0])}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => toast("Connect a LiveKit or Twilio provider to enable secure calls.", "info")} title="Start audio call" className="press rounded-lg p-2 text-ink-3 hover:bg-s2 hover:text-ink"><Phone size={15} /></button>
              <button onClick={() => toast("Connect a LiveKit or Twilio provider to enable secure calls.", "info")} title="Start video call" className="press rounded-lg p-2 text-ink-3 hover:bg-s2 hover:text-ink"><Video size={15} /></button>
              {/* Inline Search */}
              <div className="glass-1 flex items-center gap-2 rounded-xl px-2.5 h-8 w-32 sm:w-44 transition-all focus-within:w-40 sm:focus-within:w-56">
                {search.trim() ? <PiOrb size={14} state="searching" /> : <Search size={12} className="text-ink-3" />}
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search thread…"
                  className="w-full bg-transparent text-[11px] text-ink outline-none placeholder:text-ink-3"
                />
              </div>
              
              {/* Tab Toggle (Star icon instead of text tab) */}
              <button
                onClick={() => setTab(tab === "thread" ? "important" : "thread")}
                title={tab === "thread" ? `View Marked (${importantMessages.length})` : "View Thread"}
                className={cn(
                  "press flex size-8 items-center justify-center rounded-lg transition-colors cursor-pointer",
                  tab === "important" ? "bg-warn/20 text-warn" : "bg-s2 text-ink-3 hover:text-ink"
                )}
              >
                <Star size={16} fill={tab === "important" ? "currentColor" : "none"} />
                {importantMessages.length > 0 && tab === "thread" && (
                  <span className="absolute -top-1 -right-1 size-3.5 flex items-center justify-center rounded-full bg-warn text-[8px] font-bold text-black border border-bg shadow-sm">
                    {importantMessages.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        ) : null}

        {/* ============ THREAD TAB ============ */}
        {tab === "thread" ? (
          <>
            <div className="flex-1 space-y-1.5 overflow-y-auto px-4.5 py-4">
              {visible.map((m, i) => {
                const prev = visible[i - 1];
                const gap = prev ? new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() : Infinity;
                const showMeta = !prev || prev.senderId !== m.senderId || gap > 5 * 60_000;
                const isImportant = m.importantLabel !== null;
                return (
                  <div key={m.id} id={`message-${m.id}`}>
                    {meta.firstUnreadId === m.id ? (
                      <div className="my-4 flex items-center gap-3">
                        <div className="h-px flex-1 bg-line" />
                        <span className="text-[10.5px] font-semibold tracking-[0.14em] text-acc uppercase">New since your last visit</span>
                        <div className="h-px flex-1 bg-line" />
                      </div>
                    ) : null}
                    <div className={cn("group flex", m.mine ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[82%] sm:max-w-[70%]", showMeta && "mt-2.5")}>
                        <div className="relative">
                          <div
                            className={cn(
                              "anim-in rounded-2xl px-3.5 py-2 text-[13.5px] leading-relaxed whitespace-pre-wrap",
                              m.mine
                                ? "rounded-br-md text-white [background:linear-gradient(135deg,#6d52e8,#5a54e2_60%,#3f8fe0)] shadow-[0_4px_16px_-6px_rgba(109,82,232,.5)]"
                                : "glass-1 rounded-bl-md text-ink",
                              m.isUnread && !m.mine && "ring-1 ring-[color-mix(in_oklab,var(--c-acc)_22%,transparent)]",
                              isImportant && "ring-1 ring-[color-mix(in_oklab,var(--c-warn)_40%,transparent)]"
                            )}
                          >
                            {highlight(m.content, search)}
                            {m.meta.location ? <a className="mt-2 flex items-center gap-1 text-[11px] underline" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${m.meta.location.latitude}&mlon=${m.meta.location.longitude}`}> <MapPin size={12} /> {m.meta.location.label}</a> : null}
                            {m.meta.attachments?.map((a) => a.type === "image" || a.type === "sticker" ? <img key={a.url} src={a.url} alt="Shared attachment" className="mt-2 max-h-56 rounded-lg" /> : a.type === "video" ? <video key={a.url} src={a.url} controls className="mt-2 max-h-56 rounded-lg" /> : a.type === "audio" ? <audio key={a.url} src={a.url} controls className="mt-2 max-w-full" /> : <a key={a.url} href={a.url} target="_blank" rel="noreferrer" className="mt-2 block underline">Open shared file</a>)}
                          </div>
                          {/* important label tag */}
                          {isImportant ? (
                            <span className="absolute -top-2 -right-1 flex items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--c-warn)_18%,transparent)] border border-[color-mix(in_oklab,var(--c-warn)_30%,transparent)] px-1.5 py-0.5 text-[9px] font-bold text-warn uppercase">
                              <Star size={8} fill="currentColor" /> {m.importantLabel || "i"}
                            </span>
                          ) : null}
                          {/* hover actions */}
                          <div className={cn("absolute top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100", m.mine ? "-left-16" : "-right-16")}>
                            {isImportant ? (
                              <button onClick={() => doUnmark(m.id)} className="press flex size-7 cursor-pointer items-center justify-center rounded-lg bg-s2 text-warn hover:bg-s3" title="Remove important" aria-label="Remove important">
                                <X size={12} />
                              </button>
                            ) : (
                              <button
                                onClick={() => { setMarkingId(m.id); setMarkLabel(""); }}
                                className="press flex size-7 cursor-pointer items-center justify-center rounded-lg bg-s2 text-ink-3 hover:bg-s3 hover:text-warn"
                                title="Mark as important (i)" aria-label="Mark important"
                              >
                                <Star size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                        {/* mark-important inline label input */}
                        {markingId === m.id ? (
                          <div className="anim-in mt-1.5 flex items-center gap-1.5">
                            <input
                              autoFocus
                              value={markLabel}
                              onChange={(e) => setMarkLabel(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") doMark(m.id); if (e.key === "Escape") setMarkingId(null); }}
                              placeholder="Label (e.g. deadline, idea, ref)"
                              className="glass-1 h-7 w-36 rounded-lg px-2 text-[11px] text-ink placeholder:text-ink-3"
                            />
                            <button onClick={() => doMark(m.id)} className="press h-7 cursor-pointer rounded-lg bg-warn/20 px-2 text-[11px] font-semibold text-warn">
                              Mark
                            </button>
                            <button onClick={() => setMarkingId(null)} className="press cursor-pointer rounded-lg p-1 text-ink-3 hover:text-ink">
                              <X size={12} />
                            </button>
                          </div>
                        ) : null}
                        {showMeta ? (
                          <p className={cn("mt-1 text-[10px] text-ink-3", m.mine && "text-right")}>
                            {new Date(m.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
              {!visible.length ? (
                <p className="py-8 text-center text-[12.5px] text-ink-3">No messages match &ldquo;{search}&rdquo;.</p>
              ) : null}
              <div ref={endRef} />
            </div>

            {/* composer */}
            <div className="border-t border-line p-3.5">
              {(attachments.length || location) ? <div className="mb-2 flex flex-wrap gap-2 text-[11px] text-ink-2">{attachments.map((a) => <button key={a.url} onClick={() => setAttachments((items) => items.filter((item) => item.url !== a.url))} className="rounded-lg bg-s2 px-2 py-1">{a.type} ×</button>)}{location ? <button onClick={() => setLocation(undefined)} className="rounded-lg bg-s2 px-2 py-1">{location.label} ×</button> : null}</div> : null}
              <div className="flex items-end gap-2.5 relative">
                {mentionOpen && importantMessages.length > 0 ? (
                  <div className="absolute bottom-full mb-2 left-0 w-64 glass-3 rounded-xl p-1 shadow-lg border border-line z-50">
                    <div className="px-2 py-1.5 border-b border-line mb-1">
                      <span className="text-[10px] uppercase font-bold text-warn tracking-widest">Insert Important</span>
                    </div>
                    {importantMessages.map((im) => (
                      <button key={im.id}
                        className="press block w-full text-left px-2.5 py-2 rounded-lg hover:bg-s2 text-[12px]"
                        onClick={() => {
                           const prefix = value.replace(/(^|\s)@i$/i, '$1');
                           setValue(prefix + `> ★ ${im.label || 'important'}\n> ${im.content}\n\n`);
                           setMentionOpen(false);
                        }}>
                        <span className="text-ink font-semibold">{im.label || 'important'}</span>
                        <span className="block truncate text-ink-3 mt-0.5">{im.content}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
                <textarea
                  value={value}
                  onChange={(e) => {
                    const val = e.target.value;
                    setValue(val);
                    setMentionOpen(/(^|\s)@i$/i.test(val));
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  rows={1}
                  placeholder={`Message ${other?.name.split(" ")[0] ?? ""}…`}
                  aria-label="Write a message"
                  className="glass-1 max-h-36 min-h-11 flex-1 resize-none rounded-xl px-3.5 py-3 text-sm text-ink placeholder:text-ink-3 focus:border-[color-mix(in_oklab,var(--c-acc)_50%,transparent)] focus:bg-s2"
                />
                <input ref={fileInput} type="file" className="hidden" accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,audio/mpeg,audio/webm,application/pdf" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; const fd = new FormData(); fd.set("file", file); const res = await fetch("/api/upload", { method: "POST", body: fd }); const data = await res.json(); if (!data.url) return toast(data.error ?? "Upload failed", "error"); const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "audio" : "file"; setAttachments((items) => [...items, { url: data.url, type }]); if (fileInput.current) fileInput.current.value = ""; }} />
                <button onClick={() => fileInput.current?.click()} title="Attach media or file" className="press rounded-lg p-2 text-ink-3 hover:bg-s2"><Paperclip size={17} /></button>
                <button onClick={() => navigator.geolocation?.getCurrentPosition((p) => setLocation({ label: "Shared location", latitude: p.coords.latitude, longitude: p.coords.longitude }), () => toast("Location permission was not granted", "error"))} title="Share location" className="press rounded-lg p-2 text-ink-3 hover:bg-s2"><MapPin size={17} /></button>
                <button onClick={() => setValue((v) => v + " 🙂")} title="Add emoji" className="press rounded-lg p-2 text-ink-3 hover:bg-s2"><Smile size={17} /></button>
                <button onClick={send} disabled={(!value.trim() && !attachments.length && !location) || pending} aria-label="Send message"
                  className="press flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-white disabled:opacity-40 [background:linear-gradient(135deg,#7c5cf0,#6258e8_55%,#3d9be9)]">
                  {pending ? <PiOrb size={18} state="synchronizing" /> : <SendHorizonal size={16} />}
                </button>
              </div>
            </div>
          </>
        ) : null}

        {/* ============ IMPORTANT TAB ============ */}
        {tab === "important" ? (
          <div className="flex-1 overflow-y-auto px-4.5 py-4">
            {importantMessages.length ? (
              <div className="space-y-2.5">
                {importantMessages.map((im) => (
                  <div key={im.id} className="glass-1 hover-lift group rounded-xl p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.12em] text-warn uppercase">
                        <Star size={10} fill="currentColor" /> {im.label || "important"}
                      </span>
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => {
                            const el = document.getElementById(`message-${im.messageId}`);
                            if (el) { setTab("thread"); requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "center" })); }
                          }}
                          className="press cursor-pointer rounded-lg p-1 text-ink-3 hover:text-ink" title="Jump to message"
                        >
                          <Bookmark size={12} />
                        </button>
                        <button onClick={() => doUnmark(im.messageId)}
                          className="press cursor-pointer rounded-lg p-1 text-ink-3 hover:text-danger" title="Remove">
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink whitespace-pre-wrap">{im.content}</p>
                    <p className="mt-2 text-[10.5px] text-ink-3">
                      {im.senderName} · {timeAgo(im.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-14 text-center">
                <Star size={20} className="text-ink-3" />
                <p className="mt-3 text-[13px] font-medium text-ink">No important messages yet</p>
                <p className="mt-1 max-w-xs text-[12px] text-ink-3">
                  Hover any message and click ★ to mark it. Add a label like &ldquo;deadline&rdquo; or &ldquo;idea&rdquo; to find it instantly later.
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* ============ sidebar ============ */}
      <aside className="hidden min-h-0 flex-col overflow-y-auto xl:flex">
        <div className="border-b border-line px-4.5 py-3">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-ink-3 uppercase">PI Thread Brief</p>
        </div>
        <div className="space-y-3 p-4">
          <div className="glass-1 rounded-2xl p-3.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[12.5px] font-semibold text-ink">Summary</p>
              <button onClick={copySummary} className="press cursor-pointer rounded-lg p-1.5 text-ink-3 hover:bg-s2 hover:text-ink" aria-label="Copy summary">
                <Copy size={13} />
              </button>
            </div>
            <p className="text-[12.5px] leading-relaxed text-ink-2">{insight.summary}</p>
          </div>

          <div className="glass-1 rounded-2xl p-3.5">
            <p className="mb-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-ink"><Sparkles size={13} className="text-acc" /> Action cues</p>
            <ul className="space-y-1.5 text-[12.5px] text-ink-2">
              {insight.actionItems.map((item) => (
                <li key={item} className="flex gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-acc" /> <span>{item}</span></li>
              ))}
            </ul>
          </div>

          {/* important summary in sidebar */}
          {importantMessages.length ? (
            <div className="glass-1 rounded-2xl p-3.5">
              <p className="mb-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
                <Star size={13} className="text-warn" /> Marked ({importantMessages.length})
              </p>
              <div className="space-y-2">
                {importantMessages.slice(0, 5).map((im) => (
                  <button
                    key={im.id}
                    onClick={() => {
                      setTab("thread");
                      requestAnimationFrame(() => {
                        const el = document.getElementById(`message-${im.messageId}`);
                        el?.scrollIntoView({ behavior: "smooth", block: "center" });
                      });
                    }}
                    className="block w-full cursor-pointer rounded-lg border border-line px-2.5 py-2 text-left transition-colors hover:bg-s2"
                  >
                    <span className="flex items-center gap-1 text-[9px] font-bold tracking-[0.1em] text-warn uppercase">
                      <Star size={8} fill="currentColor" /> {im.label || "i"}
                    </span>
                    <p className="mt-0.5 line-clamp-2 text-[11.5px] text-ink-2">{im.content}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="glass-1 rounded-2xl p-3.5">
            <p className="mb-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-ink"><CalendarDays size={13} className="text-acc-3" /> Stats</p>
            <div className="grid grid-cols-2 gap-3 text-[12px] text-ink-2">
              <div>
                <p className="tnum text-lg font-semibold text-ink">{meta.messageCount}</p>
                <p className="text-ink-3">messages</p>
              </div>
              <div>
                <p className="tnum text-lg font-semibold text-ink">{timeAgo(meta.lastMessageAt)}</p>
                <p className="text-ink-3">last activity</p>
              </div>
            </div>
            <p className="mt-3 text-[11.5px] text-ink-3">Started {fmtDate(meta.startedAt)}</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
