"use client";

import { useState } from "react";
import { PenLine } from "lucide-react";
import { Avatar } from "@/components/pi/avatar";
import { ComposerModal } from "./composer";

export function QuickComposer({
  name,
  accent,
  avatarUrl,
  roles,
  communityId,
  placeholder = "Share something worth knowing…",
}: {
  name: string;
  accent: string;
  avatarUrl: string | null;
  roles: string[];
  communityId?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="glass-2 hover-lift flex w-full cursor-pointer items-center gap-3 rounded-2xl p-3.5 text-left"
      >
        <Avatar name={name} accent={accent} avatarUrl={avatarUrl} roles={roles} size={40} showBadge={false} />
        <span className="flex-1 text-[13.5px] text-ink-3">{placeholder}</span>
        <span className="flex size-9 items-center justify-center rounded-xl bg-s3 text-ink-2">
          <PenLine size={15} />
        </span>
      </button>
      {open ? <ComposerModal open onClose={() => setOpen(false)} kind="post" communityId={communityId} /> : null}
    </>
  );
}
