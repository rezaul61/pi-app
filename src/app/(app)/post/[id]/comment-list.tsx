"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MessageSquare, ThumbsUp, Lightbulb, Heart, Reply } from "lucide-react";
import { Avatar } from "@/components/pi/avatar";
import { RoleBadge } from "@/components/pi/badge";
import { Chip } from "@/components/pi/primitives";
import { useToast } from "@/components/pi/toast";
import { categorizeCommentAction, commentAction } from "@/server/actions/posts";
import { cn, timeAgo } from "@/lib/utils";
import type { CommentRow } from "@/server/services/feed";

export function CommentList({ comments, postId }: { comments: CommentRow[]; postId: string }) {
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyVal, setReplyVal] = useState("");
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const roots = comments.filter(c => !c.parentId);
  const getReplies = (id: string) => comments.filter(c => c.parentId === id);

  const submitReply = (parentId: string) => {
    if (!replyVal.trim() || pending) return;
    startTransition(async () => {
      const res = await commentAction(postId, replyVal, parentId);
      if (res.ok) {
        setReplyVal("");
        setReplyTo(null);
        toast("Reply sent", "success");
      }
    });
  };

  const handleCategorize = (commentId: string, cat: string) => {
    startTransition(async () => {
      await categorizeCommentAction(commentId, cat);
    });
  };

  const renderComment = (c: CommentRow, isReply = false) => {
    const maxCat = Object.entries(c.categoryCounts).sort((a, b) => b[1] - a[1])[0];
    const catIcons: any = { interesting: Lightbulb, informative: MessageSquare, helpful: ThumbsUp };
    
    return (
      <div key={c.id} className={cn("flex gap-3", isReply && "mt-3 ml-11 pl-3 border-l-2 border-line")}>
        <Link href={`/u/${c.author.username}`} className="shrink-0">
          <Avatar name={c.author.name} accent={c.author.accent} avatarUrl={c.author.avatarUrl} roles={c.author.roles} size={isReply ? 28 : 36} />
        </Link>
        <div className="group min-w-0 flex-1">
          <div className="glass-1 relative rounded-2xl rounded-tl-md px-3.5 py-2.5">
            <p className="flex items-center gap-1.5 text-[12.5px]">
              <Link href={`/u/${c.author.username}`} className="font-semibold text-ink hover:underline">
                {c.author.name}
              </Link>
              <RoleBadge roles={c.author.roles} size={14} />
              <span className="text-ink-3">· {timeAgo(c.createdAt)}</span>
            </p>
            <p className="mt-0.5 text-[13.5px] leading-relaxed whitespace-pre-wrap text-ink-2">{c.content}</p>
            
            {maxCat && maxCat[1] > 0 && (
              <div className="absolute -top-2.5 -right-2">
                <Chip active className="bg-s3 shadow-sm py-0 h-5 px-1.5 border-acc/30">
                  {catIcons[maxCat[0]] && <span className="text-acc mr-1">{(() => { const Icon = catIcons[maxCat[0]]; return <Icon size={10} />; })()}</span>}
                  <span className="text-[9px] uppercase font-bold tracking-tighter">{maxCat[0]}</span>
                </Chip>
              </div>
            )}
          </div>

          <div className="mt-1 flex items-center gap-4 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setReplyTo(replyTo === c.id ? null : c.id)} className="flex items-center gap-1 text-[11px] font-medium text-ink-3 hover:text-acc">
              <Reply size={12} /> Reply
            </button>
            <div className="flex items-center gap-2">
              {['interesting', 'informative', 'helpful'].map(cat => (
                <button key={cat} onClick={() => handleCategorize(c.id, cat)} className="text-[10px] text-ink-3 hover:text-signal capitalize">
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {replyTo === c.id && (
            <div className="mt-2 flex gap-2">
              <textarea 
                autoFocus
                value={replyVal}
                onChange={(e) => setReplyVal(e.target.value)}
                placeholder="Write a reply..."
                className="glass-1 flex-1 min-h-9 max-h-24 rounded-xl px-3 py-2 text-xs text-ink outline-none focus:bg-s2"
              />
              <button 
                onClick={() => submitReply(c.id)}
                disabled={!replyVal.trim() || pending}
                className="press self-end size-9 flex items-center justify-center rounded-xl bg-acc text-white disabled:opacity-50"
              >
                <Reply size={14} />
              </button>
            </div>
          )}

          {getReplies(c.id).map(r => renderComment(r, true))}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-6 space-y-5">
      {roots.map(c => renderComment(c))}
      {!comments.length && <p className="py-4 text-center text-ink-3 text-[13px]">No comments yet.</p>}
    </div>
  );
}
