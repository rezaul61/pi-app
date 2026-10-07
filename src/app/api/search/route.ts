import { NextRequest, NextResponse } from "next/server";
import { getViewer } from "@/server/session";
import { searchAll } from "@/server/services/misc";

export async function GET(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q") ?? "";
  const results = await searchAll(viewer, q);
  return NextResponse.json(results, {
    headers: { "Cache-Control": "private, max-age=10" },
  });
}
