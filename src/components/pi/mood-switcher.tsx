"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Sparkles } from "lucide-react";
import { Chip } from "@/components/pi/primitives";

const GOAL_LINKS: Record<string, string> = {
  Learn: "/communities",
  Network: "/network",
  Research: "/communities",
  "Find opportunities": "/opportunities",
  "Build my career": "/opportunities",
  Collaborate: "/network",
  "Share knowledge": "/communities",
};

export function MoodSwitcher({ goals }: { goals: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-flex items-center" ref={containerRef}>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="press flex items-center gap-1.5 rounded-full border border-line bg-s1 px-3 py-1 text-[11.5px] font-bold text-acc hover:bg-s2 transition-all cursor-pointer"
        >
          <Sparkles size={12} />
          <span>Switch Mood</span>
          <ChevronDown size={12} className="opacity-60" />
        </button>
      ) : (
        <div className="anim-in flex items-center gap-1.5 bg-s2/40 backdrop-blur-md rounded-full p-0.5 border border-acc/20 shadow-lg">
          <div className="no-scrollbar flex gap-1 overflow-x-auto max-w-[240px] sm:max-w-[420px] px-1">
            {goals.map((g) => (
              <Link key={g} href={GOAL_LINKS[g] ?? "/home"}>
                <Chip className="cursor-pointer hover:text-ink hover:border-line-2 bg-s3 border-acc/10 py-0.5 h-7 text-[11px] whitespace-nowrap">
                  {g}
                </Chip>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
