import type { RoleKey } from "./constants";
import { ACCENTS, ROLES } from "./constants";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

export function accentOf(key: string | null | undefined) {
  return ACCENTS[key ?? "aurora"] ?? ACCENTS.aurora;
}

export function accentGradient(key: string | null | undefined) {
  const a = accentOf(key);
  return `linear-gradient(135deg, ${a.a}, ${a.b} 52%, ${a.c})`;
}

export function roleMark(role: string | null | undefined) {
  return ROLES[(role ?? "professional") as RoleKey]?.mark ?? "P";
}

export function roleLabel(role: string | null | undefined) {
  return ROLES[(role ?? "professional") as RoleKey]?.label ?? "Professional";
}

export function timeAgo(input: Date | string) {
  const d = typeof input === "string" ? new Date(input) : input;
  const s = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d`;
  const w = Math.floor(days / 7);
  if (w < 5) return `${w}w`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function daysUntil(input: Date | string | null | undefined) {
  if (!input) return null;
  const d = typeof input === "string" ? new Date(input) : input;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

export function fmtDate(input: Date | string) {
  const d = typeof input === "string" ? new Date(input) : input;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function fmtDateTime(input: Date | string) {
  const d = typeof input === "string" ? new Date(input) : input;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function readTime(text: string) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
