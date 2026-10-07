"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { markAllReadAction } from "@/server/actions/engagement";

/* Marks all notifications read once the page settles, then syncs the badge. */
export function MarkRead() {
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const t = window.setTimeout(async () => {
      await markAllReadAction();
      router.refresh();
    }, 900);
    return () => window.clearTimeout(t);
  }, [router]);

  return null;
}
