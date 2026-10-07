"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getViewer } from "@/server/session";
import {
  blockUser,
  removeConnection,
  respondConnection,
  sendConnection,
  toggleFollow,
  unblockUser,
} from "@/server/services/people";
import { notify } from "@/server/services/misc";
import { startConversation } from "@/server/services/messages";

export async function connectAction(targetId: string) {
  const viewer = await getViewer();
  if (!viewer) return { state: "none" as const };
  const result = await sendConnection(viewer, targetId);
  if (result.state === "outgoing") {
    await notify(targetId, viewer.id, "connection_request", `${viewer.name} wants to connect with you.`, "/network");
  }
  if (result.autoAccepted) {
    await notify(targetId, viewer.id, "connection_accepted", `You are now connected with ${viewer.name}.`, `/u/${viewer.username}`);
    revalidatePath("/network");
  }
  return result;
}

export async function respondAction(requesterId: string, accept: boolean) {
  const viewer = await getViewer();
  if (!viewer) return { ok: false };
  const ok = await respondConnection(viewer, requesterId, accept);
  if (ok && accept) {
    await notify(requesterId, viewer.id, "connection_accepted", `${viewer.name} accepted your connection request.`, `/u/${viewer.username}`);
  }
  revalidatePath("/network");
  return { ok };
}

export async function removeConnectionAction(targetId: string) {
  const viewer = await getViewer();
  if (!viewer) return { ok: false };
  await removeConnection(viewer, targetId);
  revalidatePath("/network");
  return { ok: true };
}

export async function followAction(targetId: string) {
  const viewer = await getViewer();
  if (!viewer) return { following: false };
  return toggleFollow(viewer, targetId);
}

export async function blockAction(targetId: string) {
  const viewer = await getViewer();
  if (!viewer) return { ok: false };
  await blockUser(viewer, targetId);
  return { ok: true, message: "User blocked. You will no longer see their content." };
}

export async function unblockAction(targetId: string) {
  const viewer = await getViewer();
  if (!viewer) return { ok: false };
  await unblockUser(viewer, targetId);
  revalidatePath("/settings");
  return { ok: true, message: "User unblocked." };
}

export async function messageAction(targetId: string) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const id = await startConversation(viewer, targetId);
  if (!id) return;
  redirect(`/messages/${id}`);
}

export async function joinCommunityNotify() {
  /* placeholder-free: reserved for Phase 2 community announcements */
}
