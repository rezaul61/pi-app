"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, MessageSquare, Quote, UserPlus, Sparkles } from "lucide-react";
import { PiOrb } from "@/components/pi/orb";
import { Avatar } from "@/components/pi/avatar";
import { RoleBadge } from "@/components/pi/badge";
import { timeAgo, roleLabel, cn } from "@/lib/utils";
import { getThreadPreviewAction, getNotificationPreviewAction } from "@/server/actions/preview";

export type PreviewData = {
  type: "post" | "message" | "notification";
  content: string;
  timestamp: string;
  actor: {
    id?: string;
    name: string;
    username: string;
    avatarUrl: string | null;
    roles: string[];
  };
  meta?: any;
};

export function PreviewModal({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: PreviewData | null;
}) {
  const [loading, setLoading] = useState(false);
  const [contextData, setContextData] = useState<any>(null);

  useEffect(() => {
    if (!open || !data) {
      setContextData(null);
      return;
    }

    let isMounted = true;
    
    async function loadData() {
      setLoading(true);
      try {
        if (data!.type === "message" && data!.meta?.id) {
          const msgs = await getThreadPreviewAction(data!.meta.id);
          if (isMounted) setContextData({ messages: msgs });
        } else if (data!.type === "notification" && data!.meta?.type) {
          const ctx = await getNotificationPreviewAction(data!.meta.type, data!.meta.href || "", data!.actor.id || null);
          if (isMounted) setContextData(ctx);
        }
      } catch (e) {
        // silently fail and just show basic preview
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [open, data]);

  if (!open || !data) return null;

  const isSystem = data.actor.username === "system";
  const isMsg = data.type === "message";

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center" role="dialog" aria-modal>
      {/* Backdrop — tap to close */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4 mb-4 sm:mb-0 rounded-3xl glass-4 border border-line shadow-2xl overflow-hidden anim-in-up flex flex-col max-h-[85vh]">
        {/* Close X */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex size-8 cursor-pointer items-center justify-center rounded-xl text-ink-3 hover:bg-s2 hover:text-ink"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="p-5 border-b border-line/60">
          <div className="flex items-center gap-3">
            {isSystem ? (
              <PiOrb size={42} state="idle" />
            ) : (
              <Avatar
                name={data.actor.name}
                avatarUrl={data.actor.avatarUrl}
                roles={data.actor.roles}
                size={42}
                showBadge={false}
              />
            )}
            <div className="flex-1 min-w-0 pr-8">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-semibold text-ink truncate">
                  {isSystem ? "PI" : data.actor.name}
                </span>
                {!isSystem && <RoleBadge roles={data.actor.roles} size={15} />}
              </div>
              <p className="text-[11.5px] text-ink-3 mt-0.5">
                {isSystem ? "System" : roleLabel(data.actor.roles[0])} · {timeAgo(data.timestamp)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-black/20">
          {/* Loading state */}
          {loading ? (
            <div className="flex justify-center py-10">
              <PiOrb size={48} state="searching" />
            </div>
          ) : (
            <>
              {/* Message Context */}
              {isMsg ? (
                <div className="space-y-2.5">
                  {contextData?.messages?.length ? (
                    contextData.messages.map((m: any) => {
                      const isMe = m.mine;
                      return (
                        <div key={m.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                          <div className={cn("max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap shadow-sm", 
                            isMe 
                              ? "bg-[linear-gradient(135deg,#6d52e8,#5a54e2_60%,#3f8fe0)] text-white rounded-br-sm" 
                              : "glass-1 rounded-bl-sm text-ink"
                          )}>
                            {m.content}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    // Fallback to single message
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-[13px] leading-relaxed glass-1 text-ink shadow-sm whitespace-pre-wrap">
                        {data.content}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Notification Context */
                <div className="space-y-4">
                  <p className="text-[14px] leading-relaxed text-ink font-medium">{data.content}</p>
                  
                  {contextData?.type === "comment" && (
                    <div className="mt-4 rounded-xl border border-line bg-s1 p-4 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-acc opacity-70" />
                      <Quote size={14} className="text-acc mb-2 opacity-80" />
                      <p className="text-[13px] text-ink-2 leading-relaxed italic">{contextData.text}</p>
                    </div>
                  )}

                  {contextData?.type === "profile" && (
                    <div className="mt-4 rounded-xl border border-line bg-s1 p-4 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-ink">
                        <UserPlus size={14} className="text-acc" />
                        <span className="text-[13px] font-semibold">About {data.actor.name.split(' ')[0]}</span>
                      </div>
                      <p className="text-[12.5px] font-medium text-ink-2">{contextData.headline}</p>
                      {contextData.bio && <p className="text-[12px] text-ink-3 line-clamp-3">{contextData.bio}</p>}
                    </div>
                  )}

                  {contextData?.type === "reaction" && (
                    <div className="mt-4 rounded-xl border border-line bg-s1 p-3 flex items-center gap-3">
                      <Sparkles size={16} className="text-signal" />
                      <p className="text-[13px] text-ink-2">
                        Marked your post as <span className="font-semibold capitalize text-ink">{contextData.reaction}</span>.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return content;
  return createPortal(content, document.body);
}
