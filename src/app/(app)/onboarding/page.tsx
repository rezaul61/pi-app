import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer } from "@/server/session";
import { OnboardingWizard } from "@/components/auth/onboarding";
import { authErrorMessage } from "@/lib/auth-errors";

export const metadata: Metadata = { title: "Welcome to PI" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.onboarded) redirect("/home");
  const { error } = await searchParams;

  return (
    <div className="relative min-h-dvh">
      <div className="pi-ambient" aria-hidden />
      <div className="pi-noise" aria-hidden />
      <OnboardingWizard name={viewer.name} error={authErrorMessage(error)} />
    </div>
  );
}
