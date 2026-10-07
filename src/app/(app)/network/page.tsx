import { BackHome } from "@/components/pi/back-home";
import { getViewer } from "@/server/session";
import { listConnections, listRequests, listSuggestions } from "@/server/services/people";
import { networkStats } from "@/server/services/misc";
import { NetworkPulseClient } from "./page.client";

export default async function NetworkPage() {
  const viewer = (await getViewer())!;
  const [connections, requests, suggestions, stats] = await Promise.all([
    listConnections(viewer),
    listRequests(viewer),
    listSuggestions(viewer),
    networkStats(viewer),
  ]);

  return (
    <div className="space-y-4">
      <BackHome compact />
      <NetworkPulseClient
        viewer={{ id: viewer.id, name: viewer.name, username: viewer.username, accent: viewer.accent, avatarUrl: viewer.avatarUrl, roles: viewer.roles }}
        connections={connections}
        requests={requests}
        suggestions={suggestions}
        stats={stats}
      />
    </div>
  );
}
