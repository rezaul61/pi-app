import "server-only";
import { headers } from "next/headers";

const cache = new Map<string, { count: number; expires: number }>();

export async function rateLimit(limit: number, windowMs: number, scope = "default") {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const now = Date.now();
  const key = `rl:${scope}:${ip}`;

  const bucket = cache.get(key);

  if (!bucket || now > bucket.expires) {
    cache.set(key, { count: 1, expires: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { success: false, remaining: 0 };
  }

  bucket.count++;
  return { success: true, remaining: limit - bucket.count };
}

// Cleanup interval to prevent memory leaks
if (typeof global !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (now > value.expires) cache.delete(key);
    }
  }, 60000).unref();
}
