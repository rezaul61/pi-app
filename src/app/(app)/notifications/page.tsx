import { BackHome } from "@/components/pi/back-home";
import { getViewer } from "@/server/session";
import { listNotifications } from "@/server/services/misc";
import NotificationsPageClient from "./page-client";

export default async function NotificationsPage() {
  const viewer = (await getViewer())!;
  const notifications = await listNotifications(viewer);

  return (
    <div>
      <BackHome compact />
      <NotificationsPageClient notifications={notifications} />
    </div>
  );
}
