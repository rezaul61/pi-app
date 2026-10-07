"use client";

import { useState, useRef, useCallback } from "react";
import { FileText, Play } from "lucide-react";
import { cn } from "@/lib/utils";

type MediaType = "image" | "video" | "pdf";

function detectType(url: string): MediaType {
  if (/\.(mp4|webm|mov)$/i.test(url)) return "video";
  if (/\.pdf$/i.test(url)) return "pdf";
  return "image";
}

/* ── PDF viewer card ── */
function PdfCard({ url, compact = false }: { url: string; compact?: boolean }) {
  const filename = decodeURIComponent(url.split("/").pop()?.split("?")[0] ?? "document.pdf");
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group flex items-center gap-4 rounded-2xl border border-line bg-gradient-to-br from-[#1a1133] to-[#0d1a2e] p-4 transition-all hover:border-acc/40 hover:shadow-[0_0_24px_rgba(139,92,246,0.18)]",
        compact ? "w-full" : "w-full max-w-sm mx-auto mt-3.5"
      )}
    >
      <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-acc/15 shadow-[0_4px_16px_rgba(139,92,246,0.25)]">
        <FileText size={26} className="text-acc" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold text-ink group-hover:text-acc transition-colors">{filename}</p>
        <p className="mt-0.5 text-[11.5px] text-ink-3">PDF Document · Tap to open</p>
      </div>
      <div className="shrink-0 rounded-lg border border-acc/30 bg-acc/10 px-2.5 py-1 text-[11px] font-bold text-acc">
        PDF
      </div>
    </a>
  );
}

/* ── Video overlay ── */
function VideoItem({ url, fill }: { url: string; fill?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ref.current) return;
    if (ref.current.paused) { ref.current.play(); setPlaying(true); }
    else { ref.current.pause(); setPlaying(false); }
  }, []);

  return (
    <div className="relative w-full h-full">
      <video
        ref={ref}
        src={url}
        className="w-full h-full object-cover"
        loop
        playsInline
        onEnded={() => setPlaying(false)}
      />
      {!playing && (
        <button
          onClick={toggle}
          className="absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-[1px]"
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-white/90 shadow-2xl backdrop-blur-sm">
            <Play size={22} className="text-black ml-1" fill="black" />
          </span>
        </button>
      )}
    </div>
  );
}

/* ── Main Gallery ── */
export function MediaGallery({ urls }: { urls: string[] }) {
  const [active, setActive] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const total = urls.length;

  const goNext = useCallback(() => setActive(i => Math.min(i + 1, total - 1)), [total]);
  const goPrev = useCallback(() => setActive(i => Math.max(i - 1, 0)), [total]);

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    setDragging(true);
    mainRef.current?.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const diff = e.clientX - startX.current;
    const bounded = active === 0 && diff > 0 ? diff * 0.25
      : active === total - 1 && diff < 0 ? diff * 0.25 : diff;
    setDragX(bounded);
  };
  const onPointerUp = () => {
    if (startX.current === null) return;
    if (dragX < -48) goNext();
    else if (dragX > 48) goPrev();
    startX.current = null;
    setDragging(false);
    setDragX(0);
  };

  if (!urls || total === 0) return null;

  /* ─── PDFs are not in the swipe carousel — render as a card below ─── */
  const mediaUrls = urls.filter(u => detectType(u) !== "pdf");
  const pdfUrls = urls.filter(u => detectType(u) === "pdf");

  return (
    <div className="mt-3.5 space-y-2">
      {/* ─── Swipe carousel (images + videos only) ─── */}
      {mediaUrls.length > 0 && (
        <div
          className="relative w-full overflow-hidden"
          style={{
            borderRadius: 18,
            /* 3D environment */
            perspective: 1200,
          }}
        >
          {/* 3D card container */}
          <div
            ref={mainRef}
            className="relative touch-none select-none cursor-grab active:cursor-grabbing"
            style={{
              transformStyle: "preserve-3d",
              height: 360,
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {/* Slide strip — all images side by side */}
            <div
              className="absolute inset-0 flex"
              style={{
                width: `${mediaUrls.length * 100}%`,
                transform: `translateX(calc(${-active * (100 / mediaUrls.length)}% + ${dragX / mediaUrls.length}px))`,
                transition: dragging ? "none" : "transform 380ms cubic-bezier(0.25, 1, 0.35, 1)",
              }}
            >
              {mediaUrls.map((url, i) => {
                const type = detectType(url);
                const isActive = i === active;
                const dist = Math.abs(i - active);
                return (
                  <div
                    key={url}
                    className="relative overflow-hidden"
                    style={{
                      width: `${100 / mediaUrls.length}%`,
                      height: "100%",
                      transition: "transform 380ms cubic-bezier(0.25,1,0.35,1), box-shadow 380ms ease",
                      /* 3D tilt on non-active slides */
                      transform: isActive
                        ? `rotateY(0deg) scale(1) translateZ(0px)`
                        : i < active
                          ? `rotateY(8deg) scale(0.94) translateZ(-30px)`
                          : `rotateY(-8deg) scale(0.94) translateZ(-30px)`,
                      boxShadow: isActive
                        ? "0 32px 80px rgba(0,0,0,0.6), 0 8px 20px rgba(0,0,0,0.35)"
                        : "0 8px 24px rgba(0,0,0,0.25)",
                      opacity: dist > 1 ? 0 : 1 - dist * 0.12,
                    }}
                  >
                    {type === "video" ? (
                      <VideoItem url={url} />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={url}
                        alt={`Media ${i + 1}`}
                        className="h-full w-full object-cover"
                        draggable={false}
                        loading="lazy"
                      />
                    )}
                    {/* Glass sheen overlay — gives 3D depth feel */}
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background: isActive
                          ? "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)"
                          : "rgba(0,0,0,0.18)",
                        transition: "background 380ms ease",
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Dot indicators — Instagram-style */}
            {mediaUrls.length > 1 && (
              <div className="pointer-events-none absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-1.5">
                {mediaUrls.map((_, i) => (
                  <span
                    key={i}
                    className="block rounded-full transition-all duration-300"
                    style={{
                      width: i === active ? 20 : 6,
                      height: 6,
                      background: i === active
                        ? "white"
                        : "rgba(255,255,255,0.4)",
                      boxShadow: i === active ? "0 0 8px rgba(255,255,255,0.6)" : "none",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── PDF cards below the carousel ─── */}
      {pdfUrls.map(url => (
        <PdfCard key={url} url={url} />
      ))}
    </div>
  );
}
