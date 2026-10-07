"use client";

import { useEffect, useState } from "react";

const HONORIFICS = new Set(["dr.", "dr", "prof.", "prof", "mr.", "mrs.", "ms.", "mx."]);

function firstName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length > 1 && HONORIFICS.has(parts[0].toLowerCase())) return parts[1];
  return parts[0];
}

export function Greeting({ name }: { name: string }) {
  const [msg, setMsg] = useState("Good day");

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 5) setMsg("Working late");
    else if (h < 12) setMsg("Good morning");
    else if (h < 18) setMsg("Good afternoon");
    else setMsg("Good evening");
  }, []);

  return (
    <h1 className="track-heading text-[22px] font-semibold text-ink">
      {msg}, {firstName(name)}
    </h1>
  );
}
