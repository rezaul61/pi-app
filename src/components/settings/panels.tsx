"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, ImageUp, KeyRound, MonitorSmartphone, ShieldCheck, Zap } from "lucide-react";
import { Button, Card, Field, Input, Textarea } from "@/components/pi/primitives";
import { Avatar } from "@/components/pi/avatar";
import { useToast } from "@/components/pi/toast";
import { timeAgo, fmtDate } from "@/lib/utils";
import {
  changePasswordAction,
  revokeOtherSessionsAction,
  revokeSessionAction,
  updateMediaAction,
  updatePrefsAction,
  updateProfileAction,
  type SettingsState,
} from "@/server/actions/settings";
import { unblockAction } from "@/server/actions/people";
import { accentGradient, cn } from "@/lib/utils";

const ACCENT_KEYS = ["aurora", "violet", "cyan", "indigo", "mint", "amber", "rose"];

/* ------------------------------------------------------------- PROFILE */
export function ProfilePanel({
  viewer,
}: {
  viewer: {
    name: string; username: string; headline: string; bio: string;
    location: string; institution: string; website: string;
    accent: string; avatarUrl: string | null; coverUrl: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(updateProfileAction, null);
  const [accent, setAccent] = useState(viewer.accent);
  const toast = useToast();
  const router = useRouter();
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const notified = useRef(false);

  useEffect(() => {
    if (state?.ok && !notified.current) {
      notified.current = true;
      toast("Profile updated", "success");
      router.refresh();
    }
    if (!state?.ok) notified.current = false;
  }, [state, toast, router]);

  const upload = async (file: File, kind: "avatar" | "cover") => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("purpose", "profile");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        await updateMediaAction(kind, data.url);
        toast(kind === "avatar" ? "Avatar updated" : "Cover updated", "success");
        router.refresh();
      } else {
        toast(data.error ?? "Upload failed", "error");
      }
    } catch {
      toast("Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* media */}
      <Card className="overflow-hidden">
        <div className="relative h-28" style={{ background: accentGradient(accent) }}>
          {viewer.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={viewer.coverUrl} alt="Cover" className="h-full w-full object-cover" />
          ) : null}
          <button
            onClick={() => coverInput.current?.click()}
            disabled={uploading}
            className="press absolute right-3 bottom-3 flex cursor-pointer items-center gap-1.5 rounded-lg bg-black/35 px-2.5 py-1.5 text-[11.5px] font-medium text-white backdrop-blur hover:bg-black/50"
          >
            <ImageUp size={13} /> Cover
          </button>
          <input ref={coverInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "cover")} />
        </div>
        <div className="flex items-end gap-4 px-5 pb-4">
          <div className="relative -mt-9">
            <Avatar name={viewer.name} accent={accent} avatarUrl={viewer.avatarUrl} size={72} showBadge={false} />
            <button
              onClick={() => avatarInput.current?.click()}
              disabled={uploading}
              aria-label="Change avatar"
              className="press absolute -right-1 -bottom-1 flex size-7 cursor-pointer items-center justify-center rounded-full bg-s4 border border-line-2 text-ink"
            >
              <Camera size={13} />
            </button>
            <input ref={avatarInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "avatar")} />
          </div>
          <p className="pb-1 text-[12px] text-ink-3">PNG, JPG or WebP · up to 4 MB</p>
        </div>
      </Card>

      {/* fields */}
      <Card className="p-5">
        <form action={formAction} className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <Input name="name" defaultValue={viewer.name} required />
          </Field>
          <Field label="Username">
            <Input name="username" defaultValue={viewer.username} required />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Headline" hint="one sentence">
              <Input name="headline" defaultValue={viewer.headline} placeholder="What you do, precisely" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Bio">
              <Textarea name="bio" rows={3} defaultValue={viewer.bio} placeholder="Your work, your focus, what you're looking for" />
            </Field>
          </div>
          <Field label="Institution / Organization">
            <Input name="institution" defaultValue={viewer.institution} />
          </Field>
          <Field label="Location">
            <Input name="location" defaultValue={viewer.location} />
          </Field>
          <Field label="Website">
            <Input name="website" defaultValue={viewer.website} placeholder="lab.example.edu" />
          </Field>
          <Field label="Identity accent">
            <div className="flex gap-2 pt-1">
              {ACCENT_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAccent(key)}
                  aria-label={`Accent ${key}`}
                  className={cn("press size-8 cursor-pointer rounded-[10px]", accent === key && "ring-2 ring-[var(--c-acc)] ring-offset-2 ring-offset-transparent")}
                  style={{ background: accentGradient(key) }}
                />
              ))}
            </div>
            <input type="hidden" name="accent" value={accent} />
          </Field>

          {state?.error ? (
            <p className="sm:col-span-2 rounded-xl border border-[color-mix(in_oklab,var(--c-danger)_30%,transparent)] bg-[color-mix(in_oklab,var(--c-danger)_8%,transparent)] px-3.5 py-2.5 text-[13px] text-danger">
              {state.error}
            </p>
          ) : null}

          <div className="sm:col-span-2">
            <Button type="submit" loading={pending}>Save changes</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------- APPEARANCE */
export function AppearancePanel({ theme: initialTheme, fx: initialFx }: { theme: string; fx: string }) {
  const [theme, setTheme] = useState(initialTheme);
  const [fx, setFx] = useState(initialFx);
  const toast = useToast();

  const pickTheme = (t: string) => {
    setTheme(t);
    document.documentElement.dataset.theme = t;
    void updatePrefsAction(t, undefined);
    toast(t === "light" ? "Pearl environment" : "Midnight environment", "info");
  };

  const pickFx = (f: string) => {
    setFx(f);
    document.documentElement.dataset.fx = f;
    void updatePrefsAction(undefined, f);
    toast("Effects profile updated", "info");
  };

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h3 className="track-heading text-[15px] font-semibold text-ink">Environment</h3>
        <p className="mt-1 text-[12.5px] text-ink-2">Two complete visual worlds — not an inversion.</p>
        
        {/* Compact Switcher — Tabs logic */}
        <div className="mt-4 flex p-1.5 glass-1 rounded-2xl gap-1.5 max-w-[280px]">
          {[
            { key: "dark", label: "Midnight", bg: "linear-gradient(135deg, #0a0e1a, #1a1f3c)" },
            { key: "light", label: "Pearl", bg: "linear-gradient(135deg, #fbfaf8, #eceaf3)" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => pickTheme(t.key)}
              className={cn(
                "press relative flex-1 flex flex-col items-center justify-center h-14 rounded-xl border transition-all overflow-hidden cursor-pointer",
                theme === t.key 
                  ? "border-[color-mix(in_oklab,var(--c-acc)_40%,transparent)] ring-1 ring-[var(--c-acc)]/30" 
                  : "border-transparent opacity-60 grayscale-[0.4] hover:opacity-100"
              )}
              style={{ background: t.bg }}
            >
              <div className="absolute inset-0 z-10 bg-black/5" />
              <span className={cn(
                "relative z-20 text-[12px] font-bold tracking-[0.06em] uppercase",
                t.key === "dark" ? "text-white/90" : "text-[#191a33]/90"
              )}>
                {t.label}
              </span>
              {theme === t.key && (
                <span className="absolute bottom-1.5 flex gap-0.5">
                  <div className="size-1 rounded-full bg-acc" />
                  <div className="size-1 rounded-full bg-acc-3" />
                </span>
              )}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="track-heading text-[15px] font-semibold text-ink">Effects profile</h3>
        <p className="mt-1 text-[12.5px] text-ink-2">
          PI adapts blur, shadows and ambient motion. Reduced-motion preferences are always respected.
        </p>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {[
            { key: "premium", label: "Premium", desc: "Full glass, ambient aurora" },
            { key: "balanced", label: "Balanced", desc: "Reduced blur & motion" },
            { key: "performance", label: "Performance", desc: "Minimal effects, max speed" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => pickFx(f.key)}
              className={cn(
                "press cursor-pointer rounded-2xl border p-4 text-left",
                fx === f.key
                  ? "border-[color-mix(in_oklab,var(--c-acc)_55%,transparent)] bg-[color-mix(in_oklab,var(--c-acc)_10%,transparent)]"
                  : "glass-1 hover:bg-s2"
              )}
            >
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                {f.label} {fx === f.key ? <Check size={13} className="text-acc" /> : null}
              </span>
              <span className="mt-1 block text-[11.5px] leading-snug text-ink-3">{f.desc}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="track-heading flex items-center gap-2 text-[15px] font-semibold text-ink mb-3">
          <Zap size={15} className="text-acc-3" /> Gestures & Flow
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-ink font-medium">Swipe between feed categories</p>
              <p className="text-[11px] text-ink-3">Navigate Research, Article, and Post feeds with horizontal swipes.</p>
            </div>
            <button className="w-10 h-6 bg-signal rounded-full relative"><div className="absolute size-4 bg-white rounded-full top-1 left-5" /></button>
          </div>
          <div className="flex items-center justify-between border-t border-line pt-4">
            <div>
              <p className="text-[13px] text-ink font-medium">Contextual previews on long press</p>
              <p className="text-[11px] text-ink-3">Hold a notification or message card to peek at content.</p>
            </div>
            <button className="w-10 h-6 bg-signal rounded-full relative"><div className="absolute size-4 bg-white rounded-full top-1 left-5" /></button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------ SECURITY */
export function SecurityPanel({
  sessions,
}: {
  sessions: Array<{ token: string; userAgent: string; createdAt: string; current: boolean }>;
}) {
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(changePasswordAction, null);
  const toast = useToast();
  const noted = useRef(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (state?.ok && !noted.current) {
      noted.current = true;
      toast("Password changed — other sessions signed out", "success");
      router.refresh();
    }
    if (!state?.ok) noted.current = false;
  }, [state, toast, router]);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5 h-fit">
          <h3 className="track-heading flex items-center gap-2 text-[15px] font-semibold text-ink">
            <KeyRound size={15} className="text-acc" /> Password
          </h3>
          <form action={formAction} className="mt-4 space-y-3.5">
            <Field label="Current password">
              <Input name="current" type="password" required />
            </Field>
            <Field label="New password">
              <Input name="next" type="password" required />
            </Field>
            {state?.error && <p className="text-[12px] text-danger">{state.error}</p>}
            <Button type="submit" loading={pending} className="w-full">Update</Button>
          </form>
        </Card>

        <Card className="p-5 h-fit">
          <h3 className="track-heading flex items-center gap-2 text-[15px] font-semibold text-ink">
            <ShieldCheck size={15} className="text-signal" /> Account protection
          </h3>
          <p className="mt-3 text-[12.5px] text-ink-2 leading-relaxed">
            Password changes sign out every other device. Two-factor authentication is intentionally not shown as enabled until a real authenticator enrollment and recovery-code flow is configured.
          </p>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="track-heading flex items-center gap-2 text-[15px] font-semibold text-ink mb-4">
          <MonitorSmartphone size={15} className="text-acc" /> Device sessions
        </h3>
        <div className="space-y-1">
          {sessions.map((s) => (
            <div key={s.token} className="flex items-center gap-4 p-3 rounded-xl hover:bg-s1 transition-colors group">
              <div className="size-10 rounded-xl bg-s2 flex items-center justify-center text-ink-3">
                <MonitorSmartphone size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[13.5px] font-medium text-ink">{s.userAgent || "Unknown Device"}</p>
                  {s.current && <span className="bg-signal/20 text-signal text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">Current</span>}
                </div>
                <p className="text-[11px] text-ink-3">Last active {timeAgo(s.createdAt)} • {fmtDate(s.createdAt)}</p>
              </div>
              {!s.current ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startTransition(async () => {
                    const result = await revokeSessionAction(s.token);
                    toast(result.ok ? "Device signed out" : "Could not remove that device", result.ok ? "info" : "error");
                    if (result.ok) router.refresh();
                  })}
                >
                  Sign out
                </Button>
              ) : null}
            </div>
          ))}
        </div>
        <Button variant="secondary" size="sm" className="mt-4"
          onClick={() => startTransition(async () => { await revokeOtherSessionsAction(); toast("Terminated other sessions", "info"); router.refresh(); })}>
          Revoke all other devices
        </Button>
      </Card>

      <Card className="p-5">
        <h3 className="track-heading text-[15px] font-semibold text-ink mb-3">Security Gestures</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-ink-2">Secondary verification on sensitive actions</span>
            <button className="w-10 h-6 bg-signal rounded-full relative"><div className="absolute size-4 bg-white rounded-full top-1 left-5" /></button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-ink-2">Auto-lock session after 30m inactivity</span>
            <button className="w-10 h-6 bg-s3 rounded-full relative"><div className="absolute size-4 bg-white rounded-full top-1 left-1" /></button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------- PRIVACY */
export function PrivacyPanel({
  blocked,
  oppAlerts,
}: {
  blocked: Array<{ id: string; name: string; username: string; accent: string; avatarUrl: string | null }>;
  oppAlerts: boolean;
}) {
  const [, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const [alerts, setAlerts] = useState(oppAlerts);

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="track-heading text-[15px] font-semibold text-ink">Opportunity Alerts</h3>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
              Automatically notify me about high-match jobs and grants when they are posted, and at 72h / 12h before the deadline.
            </p>
          </div>
          <button
            onClick={() => {
              const next = !alerts;
              setAlerts(next);
              startTransition(async () => {
                await updatePrefsAction(undefined, undefined, next);
                toast(next ? "Alerts enabled" : "Alerts paused", "info");
              });
            }}
            className={cn(
              "press relative flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors",
              alerts ? "bg-acc" : "bg-s3"
            )}
          >
            <span
              className={cn(
                "absolute h-4 w-4 rounded-full bg-white transition-transform",
                alerts ? "translate-x-5" : "translate-x-1"
              )}
            />
          </button>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="track-heading text-[15px] font-semibold text-ink">Blocked accounts</h3>
        <p className="mt-1 text-[12.5px] text-ink-2">
          Blocked people cannot see your posts, and you cannot see theirs.
        </p>
        {blocked.length ? (
          <div className="mt-4 divide-y divide-[var(--c-line)]">
            {blocked.map((b) => (
              <div key={b.id} className="flex items-center gap-3 py-3">
                <Avatar name={b.name} accent={b.accent} avatarUrl={b.avatarUrl} size={36} showBadge={false} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-ink">{b.name}</p>
                  <p className="text-[11px] text-ink-3">@{b.username}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    startTransition(async () => {
                      const res = await unblockAction(b.id);
                      toast(res.message ?? "Unblocked", "info");
                      router.refresh();
                    })
                  }
                >
                  Unblock
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-xl glass-1 px-4 py-3 text-[12.5px] text-ink-3">
            You haven&apos;t blocked anyone. Good.
          </p>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="track-heading text-[15px] font-semibold text-ink">Your data</h3>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
          Posts you mark <span className="font-medium text-ink">Network-only</span> are visible exclusively to your
          accepted connections. Vault items, saved opportunities and messages are visible to you alone.
          Reports are reviewed by PI Trust and are never shared with the reported party.
        </p>
      </Card>
    </div>
  );
}
