"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/pi/primitives";
import { PiOrb } from "@/components/pi/orb";
import { GOALS, INTERESTS, ROLES, type RoleKey } from "@/lib/constants";
import { accentGradient, cn } from "@/lib/utils";

const STEPS = ["Who are you?", "What matters to you?", "What do you want from PI?", "Make it yours"];
const ACCENT_KEYS = ["aurora", "violet", "cyan", "indigo", "mint", "rose"];

export function OnboardingWizard({ name, error }: { name: string; error?: string | null }) {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<RoleKey | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [accent, setAccent] = useState("aurora");

  const toggle = (list: string[], set: (v: string[]) => void, item: string, max: number) => {
    set(list.includes(item) ? list.filter((x) => x !== item) : list.length < max ? [...list, item] : list);
  };

  const canContinue =
    (step === 0 && role !== null) ||
    (step === 1 && interests.length >= 2) ||
    (step === 2 && goals.length >= 1) ||
    step === 3;

  return (
    <form action="/api/auth/onboarding" method="post" className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-6 py-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-[10px] aurora-surface text-white">
            <span className="font-serif text-base italic">π</span>
          </span>
          <span className="text-[13px] font-semibold tracking-[0.18em] text-ink">PI</span>
        </div>
        <span className="tnum text-[11.5px] text-ink-3">Step {step + 1} of {STEPS.length}</span>
      </div>

      <div className="mt-5 h-1 overflow-hidden rounded-full bg-s2">
        <div className="h-full rounded-full transition-all duration-500 [background:linear-gradient(90deg,var(--c-acc),var(--c-acc-3))]" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      <div key={step} className="anim-in-up flex flex-1 flex-col pt-10">
        <h1 className="track-heading text-[26px] font-semibold text-ink">{STEPS[step]}</h1>
        <p className="mt-1.5 text-[13.5px] text-ink-2">
          {step === 0 && `Welcome, ${name.split(" ")[0]}. Choose the identity that fits — you can hold several roles on PI.`}
          {step === 1 && "Pick at least two. Your home, matches and network grow from these."}
          {step === 2 && "PI tunes your experience around what you actually want."}
          {step === 3 && "Choose the light signature of your identity."}
        </p>

        {step === 0 ? (
          <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {(Object.keys(ROLES) as RoleKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setRole(key)}
                className={cn(
                  "press flex cursor-pointer flex-col items-center gap-2.5 rounded-2xl border p-4",
                  role === key
                    ? "border-[color-mix(in_oklab,var(--c-acc)_55%,transparent)] bg-[color-mix(in_oklab,var(--c-acc)_12%,transparent)]"
                    : "glass-1 hover:bg-s2"
                )}
              >
                <span className="pi-blob flex size-10 items-center justify-center text-[15px] font-bold text-white" style={{ background: accentGradient(role === key ? accent : "indigo") }}>
                  {ROLES[key].mark}
                </span>
                <span className="text-[13px] font-medium text-ink">{ROLES[key].label}</span>
              </button>
            ))}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="mt-7 flex flex-wrap gap-2">
            {INTERESTS.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggle(interests, setInterests, i, 10)}
                className={cn(
                  "press cursor-pointer rounded-full border px-3.5 py-2 text-[13px] font-medium",
                  interests.includes(i)
                    ? "border-[color-mix(in_oklab,var(--c-acc)_55%,transparent)] bg-[color-mix(in_oklab,var(--c-acc)_14%,transparent)] text-ink"
                    : "glass-1 text-ink-2 hover:text-ink"
                )}
              >
                {i}
              </button>
            ))}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-7 grid gap-2 sm:grid-cols-2">
            {GOALS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => toggle(goals, setGoals, g, 7)}
                className={cn(
                  "press cursor-pointer rounded-2xl border px-4.5 py-3.5 text-left text-[14px] font-medium",
                  goals.includes(g)
                    ? "border-[color-mix(in_oklab,var(--c-acc)_55%,transparent)] bg-[color-mix(in_oklab,var(--c-acc)_12%,transparent)] text-ink"
                    : "glass-1 text-ink-2 hover:text-ink"
                )}
              >
                {g}
              </button>
            ))}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-7">
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
              {ACCENT_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAccent(key)}
                  aria-label={`Accent ${key}`}
                  className={cn("press h-16 cursor-pointer rounded-2xl border-2", accent === key ? "border-[var(--c-acc)]" : "border-transparent")}
                  style={{ background: accentGradient(key) }}
                />
              ))}
            </div>
            <div className="glass-2 mt-6 flex items-center gap-4 rounded-2xl p-4">
              <span className="flex size-12 items-center justify-center text-[17px] font-bold text-white" style={{ background: accentGradient(accent), borderRadius: "34%" }}>
                {name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("")}
              </span>
              <div>
                <p className="text-[14px] font-semibold text-ink">{name}</p>
                <p className="text-[12px] text-ink-3">{role ? ROLES[role].label : "Member"} · {interests.slice(0, 2).join(" · ")}</p>
              </div>
              <PiOrb size={34} className="ml-auto" />
            </div>
          </div>
        ) : null}
      </div>

      <input type="hidden" name="role" value={role ?? ""} />
      <input type="hidden" name="accent" value={accent} />
      {interests.map((interest) => <input key={interest} type="hidden" name="interests" value={interest} />)}
      {goals.map((goal) => <input key={goal} type="hidden" name="goals" value={goal} />)}

      {error ? (
        <p className="mb-3 rounded-xl border border-[color-mix(in_oklab,var(--c-danger)_30%,transparent)] bg-[color-mix(in_oklab,var(--c-danger)_8%,transparent)] px-3.5 py-2.5 text-[13px] text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between pt-6">
        <Button type="button" variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          <ArrowLeft size={15} /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={() => canContinue && setStep((s) => s + 1)} disabled={!canContinue}>
            Continue <ArrowRight size={15} />
          </Button>
        ) : (
          <Button type="submit" size="lg" disabled={!canContinue}>
            Enter PI <ArrowRight size={15} />
          </Button>
        )}
      </div>
    </form>
  );
}
