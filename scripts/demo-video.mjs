// Records the landing-page demo video against a local prod build (SHOT_BASE, default :3100).
// Human-feel: visible fake cursor, eased mouse paths, navigation by clicking the top nav.
// Flow: login → oversikt → pipeline (drag a card) → customer drawer → statistikk. ~45s, 1280x720.
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { seed, cleanup, email, password } from "./demo-data.mjs";
import { renameSync, readdirSync } from "fs";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE = process.env.SHOT_BASE || "http://localhost:3100";
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Overlay cursor that follows the real mouse events (Playwright videos have no cursor).
const CURSOR_SCRIPT = `
(() => {
  if (window.__demoCursor) return;
  window.__demoCursor = true;
  const make = () => {
    if (document.getElementById("__cursor")) return;
    const c = document.createElement("div");
    c.id = "__cursor";
    c.style.cssText = "position:fixed;z-index:999999;width:22px;height:22px;border-radius:50%;" +
      "background:rgba(27,26,24,.75);border:2.5px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.35);" +
      "pointer-events:none;transform:translate(-50%,-50%) scale(1);transition:transform .12s ease;left:-50px;top:-50px";
    document.body.appendChild(c);
  };
  const move = (e) => { make(); const c = document.getElementById("__cursor"); if (c) { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; } };
  window.addEventListener("mousemove", move, true);
  window.addEventListener("mousedown", () => { const c = document.getElementById("__cursor"); if (c) c.style.transform = "translate(-50%,-50%) scale(.72)"; }, true);
  window.addEventListener("mouseup", () => { const c = document.getElementById("__cursor"); if (c) c.style.transform = "translate(-50%,-50%) scale(1)"; }, true);
  if (document.readyState !== "loading") make(); else document.addEventListener("DOMContentLoaded", make);
})();`;

let cur = { x: 200, y: 200 };

async function glide(page, x, y, ms = 700) {
  const from = { ...cur };
  const steps = Math.max(20, Math.round(ms / 16));
  for (let i = 1; i <= steps; i++) {
    const t = easeInOut(i / steps);
    await page.mouse.move(from.x + (x - from.x) * t, from.y + (y - from.y) * t);
    await pause(ms / steps);
  }
  cur = { x, y };
}

async function glideTo(page, locator, ms = 700, dy = 0) {
  const box = await locator.boundingBox();
  if (!box) return null;
  await glide(page, box.x + box.width / 2, box.y + box.height / 2 + dy, ms);
  return box;
}

async function clickAt(page, locator, ms = 700) {
  try {
    await locator.waitFor({ state: "visible", timeout: 4000 });
  } catch { return false; }
  const box = await glideTo(page, locator, ms);
  if (!box) return false;
  await pause(180);
  await locator.click({ timeout: 3000 }).catch(() => {});
  return true;
}

async function record() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1.5,
    locale: "nb-NO",
    recordVideo: { dir: "scripts/out", size: { width: 1280, height: 720 } },
  });
  await ctx.addInitScript(CURSOR_SCRIPT);
  const page = await ctx.newPage();

  // ---- Login ----
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.mouse.move(200, 200);
  await pause(900);
  await clickAt(page, page.locator('input[name="email"]'), 600);
  await page.keyboard.type(email, { delay: 42 });
  await pause(250);
  await clickAt(page, page.locator('input[name="password"]'), 450);
  await page.keyboard.type(password, { delay: 42 });
  await pause(350);
  await clickAt(page, page.locator('button[type="submit"]'), 550);
  await page.waitForURL(/\/app\//, { timeout: 30000 });
  await page.waitForLoadState("networkidle");
  await pause(2400);

  // ---- Oversikt: hover two stat cards ----
  const cards = page.locator(".stat-card");
  if (await cards.count()) {
    await glideTo(page, cards.nth(1), 800);
    await pause(1100);
    await glideTo(page, cards.nth(4), 700);
    await pause(1100);
  } else {
    await pause(1800);
  }

  // ---- Pipeline via top nav ----
  await clickAt(page, page.getByRole("link", { name: "Pipeline" }).first(), 700);
  await page.waitForLoadState("networkidle");
  await pause(2000);

  // Drag the "Oslo Konsult" card onto the neighbouring column (drop on a card there = joins that column).
  try {
    const card = page.locator(".deal-card", { hasText: "Viken Handel" }).first();
    const target = page.locator(".deal-card", { hasText: "Trøndelag Marine" }).first();
    const src = await card.boundingBox();
    const dstBox = await target.boundingBox();
    if (src && dstBox) {
      await glide(page, src.x + src.width / 2, src.y + src.height / 2, 800);
      await pause(500);
      await page.mouse.down();
      await pause(280);
      const tx = dstBox.x + dstBox.width / 2;
      const ty = dstBox.y + dstBox.height * 0.7;
      const steps = 55;
      for (let i = 1; i <= steps; i++) {
        const t = easeInOut(i / steps);
        await page.mouse.move(
          src.x + src.width / 2 + (tx - src.x - src.width / 2) * t,
          src.y + src.height / 2 + (ty - src.y - src.height / 2) * t
        );
        await pause(20);
      }
      cur = { x: tx, y: ty };
      await pause(420);
      await page.mouse.up();
      await pause(1800);
    }
  } catch {
    await pause(1500);
  }

  // ---- Open a customer drawer, scroll softly, close ----
  try {
    await clickAt(page, page.locator(".deal-card", { hasText: "Fjord Logistikk" }).first(), 750);
    await pause(1900);
    await glide(page, 1000, 380, 500); // move over the drawer
    for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, 55); await pause(70); }
    await pause(1500);
    await clickAt(page, page.getByLabel("Lukk"), 600);
    await pause(900);
    // back to a calm state: scroll page to top before navigating
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await pause(700);
  } catch { /* drawer optional */ }

  // ---- Statistikk via top nav ----
  await clickAt(page, page.getByRole("link", { name: "Statistikk" }).first(), 700);
  await page.waitForLoadState("networkidle");
  await pause(1600);
  try {
    await clickAt(page, page.getByRole("button", { name: "Linje", exact: true }), 650);
    await pause(900);
    await clickAt(page, page.getByRole("button", { name: "Alt", exact: true }), 650);
    await pause(2600);
  } catch {
    await pause(2000);
  }
  // settle on the chart
  await glide(page, 640, 430, 700);
  await pause(1500);

  await ctx.close();
  await browser.close();

  const dir = "scripts/out";
  const files = readdirSync(dir).filter((f) => f.endsWith(".webm") && f !== "demo.webm");
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
