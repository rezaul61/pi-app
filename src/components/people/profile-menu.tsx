"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, Ellipsis, Flag } from "lucide-react";
import { useToast } from "@/components/pi/toast";
import { blockAction } from "@/server/actions/people";
import { reportAction } from "@/server/actions/posts";

export function ProfileMenu({ targetId, username }: { targetId: string; username: string }) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Profile options"
        className="press flex size-9 cursor-pointer items-center justify-center rounded-xl glass-2 text-ink-2 hover:text-ink"
      >
        <Ellipsis size={16} />
      </button>
      {open ? (
        <>
          <button aria-hidden className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
          <div className="anim-scale-in glass-4 absolute right-0 z-20 mt-1.5 w-52 rounded-xl p-1.5">
            <button
              onClick={() => {
                setOpen(false);
                startTransition(async () => {
                  const res = await reportAction("user", targetId, "policy violation");
                  toast(res.message ?? "Reported", "info");
                });
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-ink-2 hover:bg-s2 hover:text-ink"
            >
              <Flag size={14.5} /> Report profile
            </button>
            <button
              onClick={() => {
                setOpen(false);
                startTransition(async () => {
                  const res = await blockAction(targetId);
                  toast(res.message ?? "Blocked", "info");
                  router.push("/home");
                });
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-danger hover:bg-[color-mix(in_oklab,var(--c-danger)_10%,transparent)]"
            >
              <Ban size={14.5} /> Block @{username}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
