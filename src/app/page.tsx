import { redirect } from "next/navigation";
import { getViewer } from "@/server/session";

export default async function Index() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  redirect(viewer.onboarded ? "/home" : "/onboarding");
}
