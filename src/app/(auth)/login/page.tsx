import type { Metadata } from "next";
import { BrandPanel, LoginForm } from "@/components/auth/forms";
import { PiOrb } from "@/components/pi/orb";
import { authErrorMessage } from "@/lib/auth-errors";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <BrandPanel />
      <div className="flex flex-col items-center justify-center px-6 py-14">
        {/* Logo + Welcome — centered together */}
        <div className="mb-8 flex flex-col items-center text-center">
          <PiOrb size={72} state="idle" />
          <h1 className="track-heading mt-5 text-[28px] font-semibold text-ink">Welcome back</h1>
          <p className="mt-1.5 text-[13.5px] text-ink-2">Sign in to your verified identity.</p>
        </div>
        <LoginForm error={authErrorMessage(error)} />
      </div>
    </div>
  );
}
