"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/server/session";
import { addVaultItem, markAllRead, removeVaultItem, toggleSaveOpportunity } from "@/server/services/misc";
import { toggleMembership } from "@/server/services/communities";

export async function markAllReadAction() {
  const viewer = await getViewer();
  if (!viewer) return { ok: false };
  await markAllRead(viewer);
  return { ok: true };
}

export async function vaultAddAction(input: { kind: string; title: string; note?: string; url?: string; tags?: string[] }) {
  const viewer = await getViewer();
  if (!viewer) return { ok: false };
  if (!input.title.trim()) return { ok: false, message: "Give it a title." };
  await addVaultItem(viewer, input);
  revalidatePath("/vault");
  return { ok: true };
}

export async function vaultRemoveAction(id: string) {
  const viewer = await getViewer();
  if (!viewer) return { ok: false };
  await removeVaultItem(viewer, id);
  revalidatePath("/vault");
  return { ok: true };
}

export async function saveOpportunityAction(id: string) {
  const viewer = await getViewer();
  if (!viewer) return { saved: false };
  return toggleSaveOpportunity(viewer, id);
}

export async function joinCommunityAction(communityId: string) {
  const viewer = await getViewer();
  if (!viewer) return { joined: false };
  return toggleMembership(viewer, communityId);
}
