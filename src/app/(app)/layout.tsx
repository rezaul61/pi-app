import { redirect } from "next/navigation";
import { getViewer } from "@/server/session";
import { unreadCount } from "@/server/services/misc";
import { AppShell } from "@/components/shell/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (!viewer.onboarded) redirect("/onboarding");

  const counts = await unreadCount(viewer);

  return (
    <AppShell
      viewer={{
        name: viewer.name,
        username: viewer.username,
        accent: viewer.accent,
        avatarUrl: viewer.avatarUrl,
        roles: viewer.roles,
        isVerified: viewer.isVerified,
        theme: viewer.theme,
        fx: viewer.fx,
      }}
      counts={counts}
    >
      {children}
    </AppShell>
  );
}
