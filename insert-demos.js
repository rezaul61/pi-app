import { db } from "./src/db/index.js";
import { posts } from "./src/db/schema.js";

async function run() {
  console.log("Inserting demo repost and tagged post...");
  
  const aminaId = "a0000000-0000-4000-8000-000000000001";
  const danaId = "a0000000-0000-4000-8000-000000000006";
  const leilaId = "a0000000-0000-4000-8000-000000000002";
  const jonasId = "a0000000-0000-4000-8000-000000000003";

  // Insert a tagged post
  await db.insert(posts).values({
    authorId: aminaId,
    kind: "post",
    title: "",
    content: "Just wrapped up an incredible session on ice-ocean models. Massive thanks to the team for catching the edge cases in the simulation before the deadline.",
    visibility: "public",
    taggedUserIds: [danaId, leilaId, jonasId],
    meta: {},
  });

  // Get a post to repost
  const res = await db.execute(`SELECT id FROM posts WHERE author_id = '${danaId}' LIMIT 1`);
  const originalPostId = res.rows[0]?.id;

  if (originalPostId) {
    // Insert a repost
    await db.insert(posts).values({
      authorId: aminaId,
      kind: "post",
      title: "",
      content: "This is exactly what the industry needs right now. The thermal management on these new prototypes is game-changing.",
      visibility: "public",
      repostedFromId: originalPostId,
      meta: {},
    });
  }
  
  console.log("Done.");
  process.exit(0);
}

run().catch(console.error);