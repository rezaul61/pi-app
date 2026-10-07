import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3104";

if (!process.env.SKIP_LOGIN) {
const browser = await chromium.launch();
const page = await browser.newPage();

const log = [];
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") log.push(`[console.${m.type()}] ${m.text().slice(0, 300)}`); });
page.on("response", (r) => { if (r.status() >= 400) log.push(`[http ${r.status()}] ${r.request().method()} ${r.url().slice(0, 140)}`); });
page.on("requestfailed", (r) => log.push(`[reqfail] ${r.method()} ${r.url().slice(0, 140)} :: ${r.failure()?.errorText}`));

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
log.push(`[page] landed on ${page.url()}`);

// Click the demo button (fills amina/pidemo314 and submits)
await page.getByText("Enter as Amina").click();
log.push("[action] clicked demo login");

try {
  await page.waitForURL("**/home", { timeout: 15000 });
  log.push(`[ok] redirected to ${page.url()}`);
  await page.waitForTimeout(2500);
  const greeting = await page.locator("h1").first().textContent();
  log.push(`[ok] home greeting: "${greeting}"`);
  const posts = await page.locator("article").count();
  log.push(`[ok] post cards rendered: ${posts}`);
} catch {
  log.push(`[fail] no redirect; still at ${page.url()}`);
  const err = await page.locator("text=/Incorrect|error|right|Enter your/i").first().textContent().catch(() => null);
  if (err) log.push(`[ui-error] ${err}`);
}

console.log(log.join("\n"));
await browser.close();
}

// ---- register flow ----
const browser2 = await chromium.launch();
const p2 = await browser2.newPage();
const log2 = [];
p2.on("console", (m) => { if (m.type() === "error") log2.push(`[console.error] ${m.text().slice(0, 300)}`); });
p2.on("response", (r) => { if (r.status() >= 400) log2.push(`[http ${r.status()}] ${r.request().method()} ${r.url().slice(0, 140)}`); });

await p2.goto(`${BASE}/register`, { waitUntil: "networkidle" });
const suffix = process.env.E2E_SUFFIX ?? "testuser";
await p2.fill('input[name="name"]', "Test Usuario");
await p2.fill('input[name="email"]', `${suffix}@example.com`);
await p2.fill('input[name="username"]', suffix.replace(/[^a-z0-9_]/g, "").slice(0, 20));
await p2.fill('input[name="password"]', "testpass123");
await p2.getByRole("button", { name: /Create my PI identity/i }).click();
log2.push("[action] submitted register");
try {
  await p2.waitForURL("**/onboarding", { timeout: 15000 });
  log2.push(`[ok] redirected to ${p2.url()}`);
  await p2.getByRole("button", { name: "Student", exact: true }).click();
  await p2.getByRole("button", { name: /Continue/i }).click();
  await p2.getByRole("button", { name: "Mathematics", exact: true }).click();
  await p2.getByRole("button", { name: "Design", exact: true }).click();
  await p2.getByRole("button", { name: /Continue/i }).click();
  await p2.getByRole("button", { name: "Learn" }).click();
  await p2.getByRole("button", { name: /Continue/i }).click();
  await p2.getByRole("button", { name: /Enter PI/i }).click();
  await p2.waitForURL("**/home", { timeout: 15000 });
  log2.push(`[ok] onboarding complete, at ${p2.url()}`);
} catch (e) {
  log2.push(`[fail] register/onboarding stopped at ${p2.url()} :: ${String(e).slice(0, 120)}`);
  const err2 = await p2.locator(".text-danger").first().textContent().catch(() => null);
  if (err2) log2.push(`[ui-error] ${err2}`);
}
console.log("--- register ---\n" + log2.join("\n"));
await browser2.close();
