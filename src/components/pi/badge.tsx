"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { ACCENTS } from "@/lib/constants";
import { roleMark, roleLabel } from "@/lib/utils";

const BADGE_TINTS: Record<string, { gradient: string; textColor: string; description: string }> = {
  student:      { gradient: "135deg, #a78bfa, #6366f1", textColor: "#ffffff", description: "Enrolled in a verified educational institution" },
  teacher:      { gradient: "135deg, #5eead4, #0ea5e9", textColor: "#003333", description: "Verified educator or instructor" },
  researcher:   { gradient: "135deg, #818cf8, #22d3ee", textColor: "#ffffff", description: "Active in academic or scientific research" },
  professional: { gradient: "135deg, #93c5fd, #6366f1", textColor: "#001a33", description: "Verified working professional" },
  entrepreneur: { gradient: "135deg, #fbbf24, #f59e0b", textColor: "#332200", description: "Founder or business builder" },
  developer:    { gradient: "135deg, #67e8f9, #4f46e5", textColor: "#ffffff", description: "Software developer or engineer" },
  creator:      { gradient: "135deg, #f0abfc, #8b5cf6", textColor: "#ffffff", description: "Content creator, artist, or media maker" },
  institution:  { gradient: "135deg, #c4b5fd, #475569", textColor: "#ffffff", description: "Official institutional account" },
};

export function RoleBadge({
  roles,
  size = 26,
  pulse = false,
  className,
}: {
  roles: string[];
  size?: number;
  pulse?: boolean;
  className?: string;
}) {
  const primary = roles.length ? roles[0] : "professional";
  const mark = roleMark(primary);
  const theme = BADGE_TINTS[primary] ?? BADGE_TINTS.professional;
  const fontSize = size * 0.54;
  const fullLabel = roleLabel(primary);
  const description = theme.description;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const toggle = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setOpen((o) => !o);
  };

  const close = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative inline-flex items-center justify-center" style={{ zIndex: open ? 60 : undefined }}>
      <span
        onClick={toggle}
        onTouchEnd={toggle}
        className={cn(
          "pi-blob anim-badge relative inline-flex shrink-0 items-center justify-center select-none cursor-pointer",
          className
        )}
        style={{
          width: size,
          height: size,
          background: `linear-gradient(${theme.gradient}, ${ACCENTS.aurora.c})`,
          backgroundSize: "240% 240%",
        }}
        aria-label={`Role: ${fullLabel}`}
        role="button"
        tabIndex={0}
      >
        <span
          className="absolute inset-0 pi-blob"
          style={{ background: "radial-gradient(90% 70% at 30% 18%, rgba(255,255,255,.35), transparent 55%)" }}
        />
        <span
          className="relative font-bold leading-none tnum"
          style={{ fontSize, letterSpacing: 0, color: theme.textColor }}
        >
          {mark}
        </span>
        {pulse ? (
          <span
            className="absolute -inset-1 pi-blob border anim-verify"
            style={{ borderColor: "color-mix(in oklab, var(--c-signal) 70%, transparent)" }}
          />
        ) : null}
      </span>

      {/* Tiny inline label — badge letter = role name, nothing else */}
      {open && (
        <>
          <div className="fixed inset-0 z-[55] bg-[color-mix(in_oklab,var(--c-bg)_30%,transparent)] backdrop-blur-[3px]" onClick={close} />
          <div
            className="glass-4 absolute z-[60] mt-1 rounded-lg border border-line/60 px-2.5 py-1.5 shadow-lg"
            style={{ top: "100%", left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[11.5px] font-bold text-ink">{mark}</span>
            <span className="text-[11.5px] text-ink-3"> — {fullLabel}</span>
          </div>
        </>
      )}
    </div>
  );
}
