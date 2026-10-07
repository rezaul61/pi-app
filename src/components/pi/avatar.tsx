import { accentGradient, cn, initials } from "@/lib/utils";
import { RoleBadge } from "./badge";

/* ============================================================
   PI Avatar — gradient identity tile (squircle), optional
   role badge overlap. Photos are supported when uploaded.
   ============================================================ */

export function Avatar({
  name,
  accent = "aurora",
  avatarUrl,
  size = 40,
  roles,
  showBadge = true,
  badgeSize,
  className,
}: {
  name: string;
  accent?: string;
  avatarUrl?: string | null;
  size?: number;
  roles?: string[];
  showBadge?: boolean;
  badgeSize?: number;
  className?: string;
}) {
  /* More rounded than squarish, still distinct from a circle */
  const radius = "42%";
  return (
    <span className={cn("relative inline-block shrink-0", className)} style={{ width: size, height: size }}>
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          style={{ borderRadius: radius }}
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center text-white"
          style={{
            borderRadius: radius,
            background: accentGradient(accent),
            boxShadow: "inset 0 1px 1px rgba(255,255,255,.3), inset 0 -3px 8px rgba(8,6,30,.25)",
          }}
        >
          <span
            className="relative font-semibold leading-none"
            style={{ fontSize: size * 0.36, letterSpacing: "-0.02em" }}
          >
            {initials(name)}
          </span>
          <span
            className="absolute inset-0"
            style={{
              borderRadius: radius,
              background: "radial-gradient(90% 60% at 30% 12%, rgba(255,255,255,.32), transparent 52%)",
            }}
          />
        </span>
      )}
    </span>
  );
}
