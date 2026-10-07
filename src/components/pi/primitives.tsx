import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { PiOrb } from "./orb";

/* ============================================================ Buttons */
export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  loading = false,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={cn(
        "press inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-55",
        size === "sm" && "h-8 px-3 text-[13px]",
        size === "md" && "h-10 px-4.5 text-sm",
        size === "lg" && "h-11 px-6 text-[15px]",
        variant === "primary" &&
          "text-white [background:linear-gradient(135deg,#7c5cf0,#6258e8_55%,#3d9be9)] shadow-[inset_0_1px_0_rgba(255,255,255,.22),0_6px_20px_-8px_rgba(124,92,240,.55)] hover:brightness-108",
        variant === "secondary" && "glass-2 text-ink hover:bg-s3",
        variant === "ghost" && "text-ink-2 hover:bg-s2 hover:text-ink",
        variant === "danger" &&
          "border border-[color-mix(in_oklab,var(--c-danger)_35%,transparent)] bg-[color-mix(in_oklab,var(--c-danger)_10%,transparent)] text-danger hover:bg-[color-mix(in_oklab,var(--c-danger)_16%,transparent)]",
        className
      )}
    >
      {loading ? <PiOrb size={18} state="synchronizing" /> : null}
      {children}
    </button>
  );
}

export function IconButton({
  children,
  className,
  label,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={cn(
        "press inline-flex size-10 cursor-pointer items-center justify-center rounded-xl text-ink-2 hover:bg-s2 hover:text-ink",
        className
      )}
    >
      {children}
    </button>
  );
}

/* ============================================================ Surfaces */
export function Card({
  children,
  className,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={cn("glass-2 rounded-2xl", hover && "hover-lift", className)}>{children}</div>
  );
}

export function Chip({ 
  children, 
  className, 
  active = false,
  style
}: { 
  children: ReactNode; 
  className?: string; 
  active?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={style}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium",
        active
          ? "border-[color-mix(in_oklab,var(--c-acc)_45%,transparent)] bg-[color-mix(in_oklab,var(--c-acc)_12%,transparent)] text-ink"
          : "border-line bg-transparent text-ink-2",
        className
      )}
    >
      {children}
    </span>
  );
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="track-heading text-[15px] font-semibold text-ink">{children}</h2>
      {hint ? <span className="text-xs text-ink-3">{hint}</span> : null}
    </div>
  );
}

export function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="tnum text-lg font-semibold text-ink">{value}</span>
      <span className="text-[11.5px] text-ink-3">{label}</span>
    </div>
  );
}

/* ============================================================ Fields */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between text-[13px] font-medium text-ink-2">
        {label}
        {hint ? <span className="text-[11px] text-ink-3">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

export function Input({
  ref,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { ref?: React.Ref<HTMLInputElement> }) {
  return (
    <input
      ref={ref}
      {...props}
      className={cn(
        "glass-1 h-10.5 w-full rounded-xl px-3.5 text-sm text-ink placeholder:text-ink-3",
        "transition-colors focus:border-[color-mix(in_oklab,var(--c-acc)_50%,transparent)] focus:bg-s2",
        props.className
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "glass-1 w-full rounded-xl px-3.5 py-3 text-sm leading-relaxed text-ink placeholder:text-ink-3",
        "transition-colors focus:border-[color-mix(in_oklab,var(--c-acc)_50%,transparent)] focus:bg-s2",
        props.className
      )}
    />
  );
}

/* ============================================================ Skeletons */
export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function PostSkeleton() {
  return (
    <div className="glass-2 rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="size-11 rounded-[34%]" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-3.5 w-2/5" />
          <SkeletonBlock className="h-3 w-1/4" />
        </div>
      </div>
      <div className="mt-4 space-y-2.5">
        <SkeletonBlock className="h-3.5 w-full" />
        <SkeletonBlock className="h-3.5 w-11/12" />
        <SkeletonBlock className="h-3.5 w-3/5" />
      </div>
      <div className="mt-5 flex gap-3">
        <SkeletonBlock className="h-7 w-16 rounded-lg" />
        <SkeletonBlock className="h-7 w-16 rounded-lg" />
        <SkeletonBlock className="h-7 w-16 rounded-lg" />
      </div>
    </div>
  );
}

/* ============================================================ States */
export function EmptyState({
  title,
  body,
  action,
  compact = false,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "py-8" : "py-16")}>
      <PiOrb size={compact ? 52 : 76} tone="calm" className="opacity-80" />
      <h3 className="track-heading mt-7 text-[15px] font-semibold text-ink">{title}</h3>
      {body ? <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-2">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  body = "PI hit an unexpected error while loading this.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="glass-3 flex size-14 items-center justify-center rounded-2xl text-danger">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 8v5m0 3.5v.5M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
      </div>
      <h3 className="track-heading mt-5 text-[15px] font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13px] text-ink-2">{body}</p>
    </div>
  );
}
