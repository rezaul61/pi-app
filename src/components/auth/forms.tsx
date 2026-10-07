"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Field, Input } from "@/components/pi/primitives";
import { PiOrb } from "@/components/pi/orb";
import { ShieldCheck, Sparkles, Waypoints } from "lucide-react";

/* -------------------------------------------------- brand panel (splash) */
export function BrandPanel() {
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setSettled(true), 1250);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between aurora-surface p-12 text-white">
      {/* The PI Orb IS the hero — centered in the panel */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
        <PiOrb size={320} state="idle" />
      </div>

      {/* top — empty spacer so justify-between works */}
      <div />

      <div className="relative">
        <h1 className="track-heading max-w-md text-[34px] leading-[1.12] font-semibold"
          style={{ opacity: settled ? 1 : 0, transition: "opacity 600ms 150ms" }}>
          Verified Social Intelligence Network
        </h1>
        <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/72"
          style={{ opacity: settled ? 1 : 0, transition: "opacity 600ms 350ms" }}>
          Identity you can trust. Knowledge that compounds. A network built for people who think.
        </p>

        <div className="mt-9 space-y-3" style={{ opacity: settled ? 1 : 0, transition: "opacity 600ms 550ms" }}>
          {[
            { icon: ShieldCheck, text: "Verified identities and roles — no impersonation" },
            { icon: Waypoints, text: "A network that maps how knowledge connects" },
            { icon: Sparkles, text: "Intelligent matches for research, learning and careers" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-[13.5px] text-white/80">
              <span className="flex size-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
                <Icon size={15} />
              </span>
              {text}
            </div>
          ))}
        </div>
      </div>

      <p className="relative text-[11.5px] text-white/45 tracking-wide">
        3.14159 26535 89793 23846 26433 83279 …
      </p>
    </div>
  );
}

function ErrorBanner({ error }: { error?: string | null }) {
  if (!error) return null;
  return (
    <p className="rounded-xl border border-[color-mix(in_oklab,var(--c-danger)_30%,transparent)] bg-[color-mix(in_oklab,var(--c-danger)_8%,transparent)] px-3.5 py-2.5 text-[13px] text-danger">
      {error}
    </p>
  );
}

/* ----------------------------------------------------------- login form */
export function LoginForm({ error }: { error?: string | null }) {
  return (
    <div className="w-full max-w-sm">
      <form action="/api/auth/login" method="post" className="anim-in-up space-y-4" style={{ animationDelay: "90ms" }}>
        <Field label="Email or username">
          <Input name="identifier" autoComplete="username" placeholder="you@university.edu" required />
        </Field>
        <Field label="Password">
          <Input name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
        </Field>

        <ErrorBanner error={error} />

        <Button type="submit" className="w-full" size="lg">
          Sign in
        </Button>
      </form>

      {/* Demo login — pure HTML form, zero JS required */}
      <form action="/api/auth/login" method="post" className="anim-in-up glass-1 mt-6 rounded-2xl p-4" style={{ animationDelay: "160ms" }}>
        <input type="hidden" name="identifier" value="amina" />
        <input type="hidden" name="password" value="pidemo314" />
        <p className="text-[11px] font-semibold tracking-[0.14em] text-ink-3 uppercase">Demo identity</p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">
          Explore PI as <span className="font-semibold text-ink">Dr. Amina Rahmani</span> — computational astrobiology researcher.
        </p>
        <Button type="submit" variant="secondary" size="sm" className="mt-3">
          Enter as Amina →
        </Button>
      </form>

      <p className="anim-in-up mt-6 text-center text-[13px] text-ink-2" style={{ animationDelay: "220ms" }}>
        New to PI? <Link href="/register" className="pi-link font-medium text-ink">Build your identity</Link>
      </p>
    </div>
  );
}

/* -------------------------------------------------------- register form */
export function RegisterForm({ error }: { error?: string | null }) {
  return (
    <div className="w-full max-w-sm">
      <div className="anim-in-up">
        <h1 className="track-heading text-[26px] font-semibold text-ink">Build your identity</h1>
        <p className="mt-1.5 text-[13.5px] text-ink-2">
          This is where your verified presence begins. Roles and interests come next — PI adapts to you.
        </p>
      </div>

      <form action="/api/auth/register" method="post" className="anim-in-up mt-7 space-y-4" style={{ animationDelay: "90ms" }}>
        <Field label="Full name">
          <Input name="name" autoComplete="name" placeholder="Dr. Maya Chen" required />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" autoComplete="email" placeholder="you@university.edu" required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Username" hint="3–20">
            <Input name="username" autoComplete="username" placeholder="mayac" required />
          </Field>
          <Field label="Password" hint="8+">
            <Input name="password" type="password" autoComplete="new-password" placeholder="••••••••" required />
          </Field>
        </div>

        <ErrorBanner error={error} />

        <Button type="submit" className="w-full" size="lg">
          Create my PI identity
        </Button>
        <p className="text-center text-[11.5px] leading-relaxed text-ink-3">
          By continuing you agree to keep PI honest: real identity, real work, real citations.
        </p>
      </form>

      <p className="anim-in-up mt-6 text-center text-[13px] text-ink-2" style={{ animationDelay: "160ms" }}>
        Already verified? <Link href="/login" className="pi-link font-medium text-ink">Sign in</Link>
      </p>
    </div>
  );
}
