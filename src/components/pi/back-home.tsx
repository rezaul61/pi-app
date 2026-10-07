import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";

export function BackHome({ compact = false }: { compact?: boolean }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Link
        href="/home"
        className="press inline-flex items-center gap-1.5 rounded-full border border-line bg-s1 px-3 py-1.5 text-[12px] font-semibold text-ink-2 hover:bg-s2 hover:text-ink"
      >
        <ArrowLeft size={14} /> Home
      </Link>
      {compact ? (
        <Link
          href="/home"
          aria-label="Close and go home"
          className="press inline-flex size-8 items-center justify-center rounded-full border border-line bg-s1 text-ink-3 hover:bg-s2 hover:text-ink"
        >
          <X size={14} />
        </Link>
      ) : null}
    </div>
  );
}
