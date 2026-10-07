"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SendHorizonal } from "lucide-react";
import { commentAction } from "@/server/actions/posts";
import { useToast } from "@/components/pi/toast";

export function CommentForm({ postId }: { postId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    const text = value.trim();
    if (!text || pending) return;
    startTransition(async () => {
      const res = await commentAction(postId, text);
      if (res.ok) {
        setValue("");
        router.refresh();
      } else {
        toast(res.message ?? "Could not comment", "error");
      }
    });
  };

  return (
    <div className="flex items-end gap-2.5">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        rows={1}
        placeholder="Add a thoughtful comment…"
        aria-label="Write a comment"
        className="glass-1 max-h-36 min-h-11 flex-1 resize-none rounded-xl px-3.5 py-3 text-sm text-ink placeholder:text-ink-3 focus:border-[color-mix(in_oklab,var(--c-acc)_50%,transparent)] focus:bg-s2"
      />
      <button
        onClick={submit}
        disabled={!value.trim() || pending}
        aria-label="Send comment"
        className="press flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-white disabled:opacity-40 [background:linear-gradient(135deg,#7c5cf0,#6258e8_55%,#3d9be9)]"
      >
        <SendHorizonal size={16} />
      </button>
    </div>
  );
}
