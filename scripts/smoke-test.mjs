/* Run after deployment: node scripts/smoke-test.mjs https://your-domain.example */
const base = process.argv[2]?.replace(/\/$/, "");
if (!base || !/^https?:\/\//.test(base)) {
  console.error("Usage: node scripts/smoke-test.mjs https://your-domain.example");
  process.exit(1);
}

const checks = ["/", "/login", "/register", "/api/health"];
let failed = false;
for (const path of checks) {
  try {
    const response = await fetch(base + path, { redirect: "manual" });
    const frame = response.headers.get("x-frame-options");
    const nosniff = response.headers.get("x-content-type-options");
    const ok = response.status < 400 && frame === "DENY" && nosniff === "nosniff";
    console.log(`${ok ? "PASS" : "FAIL"} ${path} — ${response.status}, security headers: ${frame}/${nosniff}`);
    if (!ok) failed = true;
  } catch (error) {
    console.log(`FAIL ${path} — ${error instanceof Error ? error.message : String(error)}`);
    failed = true;
  }
}
if (failed) process.exit(1);
console.log("Public smoke test passed. Run npm run test:e2e against a seeded staging database for sign-in and messaging flows.");
