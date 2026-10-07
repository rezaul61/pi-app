import { getViewer } from "@/server/session";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { Card } from "@/components/pi/primitives";

export default async function ZonesPage() {
  const viewer = (await getViewer())!;
  const rows = await db.execute(sql`SELECT z.id, z.name, z.description, z.slug, count(zm.user_id)::int AS members FROM zones z JOIN zone_members mine ON mine.zone_id = z.id AND mine.user_id = ${viewer.id}::uuid LEFT JOIN zone_members zm ON zm.zone_id = z.id GROUP BY z.id ORDER BY z.created_at DESC`);
  return <div className="mx-auto max-w-4xl"><h1 className="track-heading text-2xl font-semibold text-ink">Zones</h1><p className="mt-1 text-ink-2">Focused group spaces for working, sharing media, and bringing people together.</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{(rows.rows as Array<{id:string;name:string;description:string;members:number}>).map((z) => <Card key={z.id} className="p-5"><h2 className="font-semibold text-ink">{z.name}</h2><p className="mt-2 text-sm text-ink-2">{z.description || "A private collaboration space."}</p><p className="mt-4 text-xs text-ink-3">{z.members} members</p></Card>)}</div></div>;
}
