"use client";

import { PiOrb } from "@/components/pi/orb";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="pi-ambient" aria-hidden />
      <PiOrb size={84} state="verifying" tone="signal" />
      <h1 className="track-heading mt-8 text-[22px] font-semibold text-ink">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-2">
        PI hit an unexpected error. Nothing was lost — your data is safe.
      </p>
      <button
        onClick={reset}
        className="press mt-6 h-11 cursor-pointer rounded-xl px-6 text-[15px] font-medium text-white [background:linear-gradient(135deg,#7c5cf0,#6258e8_55%,#3d9be9)]"
      >
        Try again
      </button>
    </div>
  );
}
