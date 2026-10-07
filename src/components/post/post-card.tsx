"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  CalendarDays,
  Ellipsis,
  FileText,
  FlaskConical,
  Flag,
  Globe2,
  Heart,
  Lightbulb,
  Link2,
  MapPin,
  MessageCircle,
  Rocket,
  Ban,
  Sparkles,
  Trash2,
  Users2,
  Trophy,
  X,
} from "lucide-react";
import { roleLabel } from "@/lib/utils";
import type { FeedPost } from "@/server/services/feed";
import { Avatar } from "@/components/pi/avatar";
import { RoleBadge } from "@/components/pi/badge";
import { Chip } from "@/components/pi/primitives";
import { MediaGallery } from "@/components/post/media-gallery";
import { Modal, ConfirmDialog } from "@/components/pi/modal";
import { useToast } from "@/components/pi/toast";
import { deletePostAction, reactAction, reportAction, repostAction, savePostAction, votePollAction } from "@/server/actions/posts";
import { blockAction } from "@/server/actions/people";
import { cn, fmtDateTime, readTime, timeAgo } from "@/lib/utils";
import { Repeat2 } from "lucide-react";

const KIND_CHIP: Record<string, { label: string; icon: React.ElementType; color?: string }> = {
  article: { label: "Article", icon: FileText },
  research: { label: "Research", icon: FlaskConical },
  project: { label: "Project", icon: Rocket },
  event: { label: "Event", icon: CalendarDays },
  poll: { label: "Poll", icon: Sparkles },
  achievement: { label: "Achievement", icon: Trophy, color: "var(--c-warn)" },
  publication: { label: "Publication", icon: FileText, color: "var(--c-acc-3)" },
  job: { label: "New Job", icon: Trophy, color: "var(--c-signal)" },
};

export function PostCard({ post, viewerId, detail = false }: { post: FeedPost; viewerId: string; detail?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [reaction, setReaction] = useState<string | null>(post.myReaction);
  const [count, setCount] = useState(post.reactionCount);
  const [saved, setSaved] = useState(post.saved);
  const [menu, setMenu] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [, startTransition] = useTransition();

  const mine = post.author.id === viewerId;
  const kindMeta = KIND_CHIP[post.kind];
  const pollOptions = (post.meta?.options as Array<{ label: string }> | undefined) ?? [];
  const eventMeta = post.kind === "event" ? post.meta : null;

  const react = (type: string) => {
    const wasActive = reaction === type || reaction !== null;
    setCount((c) => (reaction ? c - 1 : c + 1));
    setReaction((r) => (r ? null : type));
    void wasActive;
    startTransition(async () => {
      await reactAction(post.id, type);
    });
  };

  const save = () => {
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      await savePostAction(post.id, post.title || post.content);
      toast(next ? "Saved to PI Vault" : "Removed from Vault", next ? "success" : "info");
    });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}/post/${post.id}`);
      toast("Link copied", "info");
    } catch {
      toast("Could not copy link", "error");
    }
    setMenu(false);
  };

  const reactionDefs = [
    { type: "insightful", icon: Lightbulb, label: "Insightful" },
    { type: "appreciate", icon: Heart, label: "Appreciate" },
    { type: "curious", icon: Sparkles, label: "Curious" },
  ];

  const isCelebratory = ["achievement", "job", "publication"].includes(post.kind);

  return (
    <article className={cn(
      "glass-2 hover-lift rounded-2xl p-5 overflow-hidden relative", 
      detail && "glass-3",
      isCelebratory && "border-acc/20 shadow-[0_0_30px_rgba(139,92,246,0.05)]"
    )}>
      {isCelebratory && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-acc via-acc-3 to-signal opacity-60" />
      )}
      {/* Blur overlay when tag list is open */}
      {tagsOpen && (
        <div className="absolute inset-0 z-[14] bg-[color-mix(in_oklab,var(--c-bg)_40%,transparent)] backdrop-blur-[6px] rounded-2xl transition-all duration-300" />
      )}
      {/* header */}
      <div className="flex items-start gap-3">
        <Link href={`/u/${post.author.username}`} className="press shrink-0" aria-label={post.author.name}>
          <Avatar name={post.author.name} accent={post.author.accent} avatarUrl={post.author.avatarUrl} roles={post.author.roles} size={44} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link href={`/u/${post.author.username}`} className="truncate text-[14px] font-semibold text-ink hover:underline">
              {post.author.name}
            </Link>
            <RoleBadge roles={post.author.roles} size={16} />
          </div>
          {post.taggedUsers.length > 0 && (
            <div className="absolute top-5 right-12 z-10">
              <div className="flex items-center gap-1">
                {post.taggedUsers.slice(0, 2).map((u) => (
                  <Link key={u.id} href={`/u/${u.username}`} title={u.name}>
                    <Avatar name={u.name} avatarUrl={u.avatarUrl} size={18} showBadge={false} />
                  </Link>
                ))}
                {post.taggedUsers.length > 2 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); setTagsOpen(!tagsOpen); }}
                    className="press flex size-[18px] cursor-pointer items-center justify-center rounded-[42%] bg-s3 border border-line text-[9px] font-bold text-ink-2 hover:bg-s2 hover:text-ink"
                  >
                    +{post.taggedUsers.length - 2}
                  </button>
                )}
              </div>
            </div>
          )}
          <p className="truncate text-[12px] text-ink-3">
            @{post.author.username} · {timeAgo(post.createdAt)}
            {post.visibility === "network" ? (
              <span className="ml-1.5 inline-flex translate-y-[1.5px] items-center gap-1 text-ink-3" title="Visible to your network only">
                <Users2 size={11} /> network
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {kindMeta ? (
            <Chip 
              active 
              className="hidden sm:inline-flex"
              style={kindMeta.color ? { borderColor: kindMeta.color, color: kindMeta.color, background: `color-mix(in oklab, ${kindMeta.color} 10%, transparent)` } : {}}
            >
              <kindMeta.icon size={11} /> {kindMeta.label}
            </Chip>
          ) : null}
          {post.community ? (
            <Link href={`/communities/${post.community.slug}`}>
              <Chip className="hidden max-w-[140px] truncate hover:border-line-2 hover:text-ink md:inline-flex">{post.community.name}</Chip>
            </Link>
          ) : null}

          <div className="relative">
            <button
              onClick={() => setMenu((m) => !m)}
              aria-label="Post options"
              className="press flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-3 hover:bg-s2 hover:text-ink"
            >
              <Ellipsis size={16} />
            </button>
            {menu ? (
              <>
                <div className="fixed inset-0 z-10 bg-[color-mix(in_oklab,var(--c-bg)_25%,transparent)] backdrop-blur-[3px] cursor-default" onClick={() => setMenu(false)} />
                <div className="anim-scale-in glass-4 absolute right-0 z-20 mt-1.5 w-52 rounded-xl p-1.5">
                  <MenuItem icon={Link2} label="Copy link" onClick={copyLink} />
                  {!mine && (
                    <MenuItem
                      icon={Repeat2}
                      label="Repost"
                      onClick={() => {
                        setMenu(false);
                        startTransition(async () => {
                          const res = await repostAction(post.id);
                          if (res.ok) toast("Reposted to your feed", "success");
                        });
                      }}
                    />
                  )}
                  <MenuItem
                    icon={Flag}
                    label="Report post"
                    onClick={() => {
                      setMenu(false);
                      startTransition(async () => {
                        const res = await reportAction("post", post.id, "inappropriate");
                        toast(res.message ?? "Reported", "info");
                      });
                    }}
                  />
                  {!mine ? (
                    <MenuItem
                      icon={Ban}
                      label={`Block @${post.author.username}`}
                      danger
                      onClick={() => {
                        setMenu(false);
                        startTransition(async () => {
                          const res = await blockAction(post.author.id);
                          toast(res.message ?? "Blocked", "info");
                          router.refresh();
                        });
                      }}
                    />
                  ) : null}
                  {mine ? (
                    <MenuItem icon={Trash2} label="Delete post" danger onClick={() => { setMenu(false); setConfirmDelete(true); }} />
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* body */}
      <div className={cn("mt-3.5", detail ? "" : "")}>
        {post.title ? (
          detail ? (
            <h1 className="track-heading text-[19px] font-semibold text-ink">{post.title}</h1>
          ) : (
            <Link href={`/post/${post.id}`}>
              <h3 className="track-heading text-[16px] font-semibold text-ink hover:underline">{post.title}</h3>
            </Link>
          )
        ) : null}
        <p className={cn("text-[14px] leading-relaxed whitespace-pre-wrap text-ink-2", post.title && "mt-1.5")}>
          {detail ? post.content : post.content.length > 380 ? post.content.slice(0, 380) + "…" : post.content}
        </p>
        {!detail && post.content.length > 380 ? (
          <Link href={`/post/${post.id}`} className="pi-link mt-1 inline-block text-[13px] font-medium text-acc">
            Read more
          </Link>
        ) : null}

        {post.kind === "article" && detail ? (
          <p className="mt-2 text-[11.5px] text-ink-3">{readTime(post.content)} min read</p>
        ) : null}

        {eventMeta ? (
          <div className="glass-1 mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl px-3.5 py-2.5 text-[12.5px] text-ink-2">
            <span className="flex items-center gap-1.5"><CalendarDays size={13} className="text-acc" /> {fmtDateTime(String(eventMeta.startsAt))}</span>
            <span className="flex items-center gap-1.5">
              {eventMeta.online ? <Globe2 size={13} className="text-acc-3" /> : <MapPin size={13} className="text-acc-3" />}
              {eventMeta.online ? "Online" : String(eventMeta.location || "Venue TBA")}
            </span>
          </div>
        ) : null}

        {post.tags.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map((t) => (
              <Chip key={t}>#{t}</Chip>
            ))}
          </div>
        ) : null}

        {post.mediaUrl || (post.meta?.mediaUrls && Array.isArray(post.meta.mediaUrls) && post.meta.mediaUrls.length > 0) ? (
          <MediaGallery urls={post.meta?.mediaUrls ? (post.meta.mediaUrls as string[]) : [post.mediaUrl!]} />
        ) : null}

        {/* poll */}
        {post.kind === "poll" && pollOptions.length ? (
          <div className="mt-3.5 space-y-2">
            {pollOptions.map((opt, i) => {
              const votes = post.pollCounts.find((c) => c.i === i)?.n ?? 0;
              const pct = post.pollTotal ? Math.round((votes / post.pollTotal) * 100) : 0;
              const chosen = post.myVote === i;
              return post.myVote === null ? (
                <button
                  key={i}
                  onClick={() =>
                    startTransition(async () => {
                      await votePollAction(post.id, i);
                      router.refresh();
                    })
                  }
                  className="glass-1 press w-full cursor-pointer rounded-xl px-4 py-2.5 text-left text-[13.5px] font-medium text-ink hover:border-[color-mix(in_oklab,var(--c-acc)_45%,transparent)]"
                >
                  {opt.label}
                </button>
              ) : (
                <div key={i} className={cn("relative overflow-hidden rounded-xl border px-4 py-2.5", chosen ? "border-[color-mix(in_oklab,var(--c-acc)_50%,transparent)]" : "border-line")}>
                  <span
                    className="anim-scale-in absolute inset-y-0 left-0 origin-left"
                    style={{
                      width: `${Math.max(pct, 2)}%`,
                      background: chosen
                        ? "linear-gradient(90deg, color-mix(in oklab, var(--c-acc) 22%, transparent), transparent)"
                        : "color-mix(in oklab, var(--c-ink) 7%, transparent)",
                    }}
                  />
                  <span className="relative flex items-center justify-between text-[13.5px]">
                    <span className={cn("font-medium", chosen ? "text-ink" : "text-ink-2")}>{opt.label}</span>
                    <span className="tnum text-[12px] text-ink-3">{pct}%</span>
                  </span>
                </div>
              );
            })}
            <p className="text-[11.5px] text-ink-3 tnum">{post.pollTotal} vote{post.pollTotal === 1 ? "" : "s"}</p>
          </div>
        ) : null}
      </div>

      {post.repostedAuthor && (
        <div className="mt-4 flex items-center gap-1.5 rounded-xl bg-[color-mix(in_oklab,var(--c-acc)_8%,transparent)] border border-[color-mix(in_oklab,var(--c-acc)_15%,transparent)] px-3 py-2 text-[12px] text-ink-2">
          <div className="size-6 rounded-lg bg-acc/20 flex items-center justify-center text-acc shrink-0">
            <Repeat2 size={14} />
          </div>
          <span className="flex-1 truncate">Reposted from <Link href={`/u/${post.repostedAuthor.username}`} className="font-bold text-ink hover:underline">@{post.repostedAuthor.username}</Link></span>
        </div>
      )}

      {/* Tagged list overlay — tiny, inside the card, above blur */}
      {tagsOpen && (
        <>
          <div className="absolute inset-0 z-[18]" onClick={() => setTagsOpen(false)} />
          <div className="anim-scale-in glass-4 absolute top-14 right-4 z-[19] w-36 max-h-40 overflow-y-auto rounded-xl border border-line shadow-2xl p-1">
            {post.taggedUsers.map((u) => (
              <Link
                key={u.id}
                href={`/u/${u.username}`}
                className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-s2 transition-colors"
                onClick={() => setTagsOpen(false)}
              >
                <Avatar name={u.name} avatarUrl={u.avatarUrl} size={18} showBadge={false} />
                <p className="text-[11px] font-medium text-ink truncate">{u.name}</p>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* interaction bar */}
      <div className="mt-4 flex items-center gap-1 border-t border-line pt-3">
        <div className="glass-1 flex items-center rounded-full p-1">
          {reactionDefs.map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => react(type)}
              aria-label={label}
              title={label}
              className={cn(
                "press flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] font-medium",
                reaction === type
                  ? "bg-[color-mix(in_oklab,var(--c-acc)_18%,transparent)] text-ink"
                  : "text-ink-3 hover:text-ink"
              )}
            >
              <Icon size={14.5} strokeWidth={reaction === type ? 2.2 : 1.8} />
              <span className="hidden lg:inline">{label}</span>
            </button>
          ))}
          <span className="tnum px-2 text-[12px] font-semibold text-ink-2">{count}</span>
        </div>

        <Link
          href={`/post/${post.id}`}
          className="press flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] font-medium text-ink-3 hover:bg-s2 hover:text-ink"
        >
          <MessageCircle size={14.5} strokeWidth={1.8} />
          <span className="tnum">{post.commentCount}</span>
          <span className="hidden lg:inline">{post.commentCount === 1 ? "comment" : "comments"}</span>
        </Link>

        <div className="ml-auto flex items-center gap-0.5">
          <button
            onClick={save}
            aria-label={saved ? "Remove from PI Vault" : "Save to PI Vault"}
            title="PI Vault"
            className={cn(
              "press flex size-9 cursor-pointer items-center justify-center rounded-xl",
              saved ? "text-acc" : "text-ink-3 hover:bg-s2 hover:text-ink"
            )}
          >
            <Bookmark size={16} strokeWidth={1.8} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* media viewer */}
      <Modal open={mediaOpen} onClose={() => setMediaOpen(false)} wide>
        {post.mediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.mediaUrl} alt="Post media full view" className="w-full rounded-xl" />
        ) : null}
        <p className="mt-3 text-[12px] text-ink-3">Shared by {post.author.name} · {timeAgo(post.createdAt)}</p>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() =>
          startTransition(async () => {
            const res = await deletePostAction(post.id);
            if (res.ok) {
              toast("Post removed", "info");
              if (detail) router.push("/home");
              else router.refresh();
            }
          })
        }
        title="Delete this post?"
        body="The post and its comments will be permanently removed from PI."
        confirmLabel="Delete"
        danger
      />
    </article>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px]",
        danger ? "text-danger hover:bg-[color-mix(in_oklab,var(--c-danger)_10%,transparent)]" : "text-ink-2 hover:bg-s2 hover:text-ink"
      )}
    >
      <Icon size={14.5} /> {label}
    </button>
  );
}


