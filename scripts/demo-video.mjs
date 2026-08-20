// Records the landing-page demo video against a local prod build (SHOT_BASE, default :3100).
// Flow: login → oversikt → pipeline (drag a card) → customer drawer → statistikk. ~40s, 1280x720.
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { seed, cleanup, email, password } from "./demo-data.mjs";
import { renameSync, readdirSync } from "fs";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE = process.env.SHOT_BASE || "http://localhost:3100";
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function record() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1.5,
    locale: "nb-NO",
    recordVideo: { dir: "scripts/out", size: { width: 1280, height: 720 } },
  });
  const page = await ctx.newPage();

  // Login (typed slowly so it reads like a person)
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await pause(800);
  await page.locator('input[name="email"]').pressSequentially(email, { delay: 35 });
  await page.locator('input[name="password"]').pressSequentially(password, { delay: 35 });
  await pause(300);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/app\//, { timeout: 30000 });
  await pause(2600);

  // Oversikt: hover a couple of stat cards
  const cards = page.locator(".stat-card");
  if (await cards.count()) {
    await cards.nth(1).hover();
    await pause(900);
    await cards.nth(3).hover();
    await pause(900);
  } else {
    await pause(1800);
  }

  // Pipeline: drag the first card in column 1 to column 2
  await page.goto(`${BASE}/app/pipeline`, { waitUntil: "networkidle" });
  await pause(2000);
  try {
    const card = page.locator(".deal-card").first();
    const src = await card.boundingBox();
    // Columns are fixed-width (268px + gap): the neighbouring column is ~284px to the right.
    const dst = src ? { x: src.x + 284, width: src.width, y: src.y } : null;
    if (src && dst) {
      await page.mouse.move(src.x + src.width / 2, src.y + src.height / 2);
      await pause(400);
      await page.mouse.down();
      // smooth path
      const steps = 24;
      const tx = dst.x + dst.width / 2, ty = dst.y + 120;
      for (let i = 1; i <= steps; i++) {
        await page.mouse.move(
          src.x + src.width / 2 + ((tx - src.x - src.width / 2) * i) / steps,
          src.y + src.height / 2 + ((ty - src.y - src.height / 2) * i) / steps
        );
        await pause(28);
      }
      await pause(300);
      await page.mouse.up();
      await pause(1600);
    }
  } catch {
    await pause(1500);
  }

  // Open a customer drawer, scroll a bit, close
  try {
    await page.locator(".deal-card").nth(3).click();
    await pause(1800);
    await page.mouse.wheel(0, 500);
    await pause(1400);
    await page.keyboard.press("Escape");
    await pause(700);
  } catch { /* drawer optional */ }

  // Statistikk: cumulative lines
  await page.goto(`${BASE}/app/statistikk`, { waitUntil: "networkidle" });
  await pause(1500);
  await page.getByRole("button", { name: "Linje" }).click().catch(() => {});
  await page.getByRole("button", { name: "Alt", exact: true }).click().catch(() => {});
  await pause(2600);

  await ctx.close();
  await browser.close();

  // Rename newest webm to demo.webm
  const dir = "scripts/out";
  const files = readdirSync(dir).filter((f) => f.endsWith(".webm"));
  if (files.length) renameSync(`${dir}/${files[files.length - 1]}`, `${dir}/demo.webm`);
  console.log("recorded scripts/out/demo.webm");
}

const c = await seed(admin);
try {
  await record();
} finally {
  await cleanup(admin, c);
  console.log("cleaned up demo org");
}
