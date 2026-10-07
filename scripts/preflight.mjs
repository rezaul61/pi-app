/* Run before deployment: node scripts/preflight.mjs */
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const requiredFiles = ["package.json", "next.config.ts", "src/db/schema.ts", ".env.local"];
const failures = [];

for (const file of requiredFiles) {
  if (!existsSync(resolve(file))) failures.push(`Missing ${file}`);
}

if (!process.env.DATABASE_URL) failures.push("DATABASE_URL is not loaded. Use: node --env-file=.env.local scripts/preflight.mjs");
if (!process.env.APP_ORIGIN) failures.push("APP_ORIGIN is not loaded. Set it to your exact public HTTPS URL.");
if (process.env.APP_ORIGIN && !/^https:\/\/[a-z0-9.-]+/i.test(process.env.APP_ORIGIN)) {
  failures.push("APP_ORIGIN must be an HTTPS URL, for example https://pi.example.com");
}
if (!existsSync(resolve("node_modules"))) failures.push("Dependencies are not installed. Run npm install.");

if (failures.length) {
  console.error("PI preflight failed:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}
console.log("PI preflight passed. Next run: npx drizzle-kit push && npm run typecheck && npm run lint && npm run build");
