import type { Metadata } from "next";
import { BrandPanel, RegisterForm } from "@/components/auth/forms";
import { PiOrb } from "@/components/pi/orb";
import { authErrorMessage } from "@/lib/auth-errors";

export const metadata: Metadata = { title: "Create your identity" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <BrandPanel />
      <div className="flex flex-col items-center justify-center px-6 py-14">
        <div className="mb-10 lg:hidden">
          <PiOrb size={56} state="idle" />
        </div>
        <RegisterForm error={authErrorMessage(error)} />
      </div>
    </div>
  );
}
