import { redirect } from "next/navigation";
import { getViewer } from "@/server/session";
import { AuthThemeToggle } from "@/components/auth/theme-toggle";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (viewer) redirect(viewer.onboarded ? "/home" : "/onboarding");

  return (
    <div className="relative min-h-dvh">
      <div className="pi-ambient" aria-hidden />
      <div className="pi-noise" aria-hidden />
      <AuthThemeToggle />
      {children}
    </div>
  );
}
