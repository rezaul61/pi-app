import { BackHome } from "@/components/pi/back-home";
import type { Metadata } from "next";
import { getViewer } from "@/server/session";
import { listVault } from "@/server/services/misc";
import { VaultManager } from "@/components/vault/vault-manager";

export const metadata: Metadata = { title: "PI Vault" };

export default async function VaultPage() {
  const viewer = (await getViewer())!;
  const items = await listVault(viewer);

  return (
    <div className="anim-in-up">
      <BackHome compact />
      <header className="mb-5">
        <h1 className="track-heading text-[22px] font-semibold text-ink">PI Vault</h1>
        <p className="mt-1 text-[13px] text-ink-2">
          Your private knowledge archive — {items.length} item{items.length === 1 ? "" : "s"} curated.
        </p>
      </header>
      <VaultManager items={items} />
    </div>
  );
}
