// High-quality demo recording: drives a HEADED browser and captures the viewport with
// ffmpeg gdigrab at 60 fps (Playwright's built-in recorder is capped at 25 fps VP8).
// Env: FFMPEG=path to ffmpeg.exe. Do not touch mouse/keyboard while it runs (~2.5 min).
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { spawn } from "child_process";
import { seed, cleanup, email, password } from "./demo-data.mjs";
import { rmSync, mkdirSync, writeFileSync } from "fs";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE = process.env.SHOT_BASE || "http://localhost:3100";
const FFMPEG = process.env.FFMPEG;
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const CURSOR_SCRIPT = `
(() => {
  if (window.__demoCursor) return;
  window.__demoCursor = true;
  const make = () => {
    if (document.getElementById("__cursor")) return;
    const c = document.createElement("div");
    c.id = "__cursor";
    c.style.cssText = "position:fixed;z-index:999999;width:20px;height:20px;border-radius:50%;" +
      "background:rgba(27,26,24,.75);border:2.5px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.35);" +
      "pointer-events:none;transform:translate(-50%,-50%) scale(1);transition:transform .12s ease;left:-50px;top:-50px";
    document.body.appendChild(c);
  };
  const move = (e) => { make(); const c = document.getElementById("__cursor"); if (c) { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; } };
  window.addEventListener("mousemove", move, true);
  window.addEventListener("mousedown", (e) => {
    const c = document.getElementById("__cursor"); if (c) c.style.transform = "translate(-50%,-50%) scale(.72)";
    const r = document.createElement("div");
    r.style.cssText = "position:fixed;z-index:999998;width:14px;height:14px;border-radius:50%;" +
      "border:3px solid rgba(168,64,42,.85);pointer-events:none;transform:translate(-50%,-50%);" +
      "transition:width .45s ease-out,height .45s ease-out,opacity .45s ease-out;opacity:1;" +
      "left:" + e.clientX + "px;top:" + e.clientY + "px";
    document.body.appendChild(r);
    requestAnimationFrame(() => { r.style.width = "56px"; r.style.height = "56px"; r.style.opacity = "0"; });
    setTimeout(() => r.remove(), 600);
  }, true);
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

async function glideTo(page, locator, ms = 700) {
  const box = await locator.boundingBox();
  if (!box) return null;
  await glide(page, box.x + box.width / 2, box.y + box.height / 2, ms);
  return box;
}

async function clickAt(page, locator, ms = 700) {
  try {
    await locator.waitFor({ state: "visible", timeout: 5000 });
  } catch { return false; }
  const box = await glideTo(page, locator, ms);
  if (!box) return false;
  await pause(180);
  await locator.click({ timeout: 3000 }).catch(() => {});
  return true;
}

async function typeSlow(page, locator, text, ms = 500) {
  await clickAt(page, locator, ms);
  await page.keyboard.type(text, { delay: 40 });
}

async function run() {
  // Headless + CDP screencast: the browser streams every painted frame (device pixels,
  // deviceScaleFactor 2 → 2560x1440) — no desktop capture, nothing visible on screen.
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2,
    locale: "nb-NO",
  });
  await ctx.addInitScript(CURSOR_SCRIPT);
  await ctx.addInitScript(`
    const st = document.createElement("style");
    st.textContent = "*::-webkit-scrollbar{width:0!important;height:0!important} *{scrollbar-width:none!important}";
    (document.head ?? document.documentElement).appendChild(st);
    document.addEventListener("DOMContentLoaded", () => document.head.appendChild(st));
  `);
  const page = await ctx.newPage();

  rmSync("scripts/out/frames", { recursive: true, force: true });
  mkdirSync("scripts/out/frames", { recursive: true });
  const cdp = await ctx.newCDPSession(page);
  const stamps = [];
  let n = 0;
  cdp.on("Page.screencastFrame", (ev) => {
    const i = n++;
    writeFileSync(`scripts/out/frames/f${String(i).padStart(5, "0")}.jpg`, Buffer.from(ev.data, "base64"));
    stamps.push(ev.metadata.timestamp);
    cdp.send("Page.screencastFrameAck", { sessionId: ev.sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: 2560, maxHeight: 1440 });

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await pause(900);

  // ---- Login ----
  await page.mouse.move(200, 200);
  await pause(600);
  await typeSlow(page, page.locator('input[name="email"]'), email, 600);
  await pause(200);
  await typeSlow(page, page.locator('input[name="password"]'), password, 450);
  await pause(300);
  await clickAt(page, page.locator('button[type="submit"]'), 550);
  await page.waitForURL(/\/app\//, { timeout: 30000 });
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => document.body.innerText.includes("10 åpne deals"), null, { timeout: 20000 }).catch(() => {});
  await pause(1500);

  // ---- Oversikt ----
  const cards = page.locator(".stat-card");
  if (await cards.count()) {
    await glideTo(page, cards.nth(1), 800);
    await pause(800);
    await clickAt(page, page.getByRole("button", { name: "Måned", exact: true }).first(), 450);
    await pause(1100);
    await clickAt(page, page.getByRole("button", { name: "År", exact: true }).first(), 400);
    await pause(1200);
  }

  // ---- Pipeline: create a new customer ----
  await clickAt(page, page.getByRole("link", { name: "Pipeline" }).first(), 700);
  await page.waitForLoadState("networkidle");
  await pause(1400);
  await clickAt(page, page.getByRole("button", { name: "Ny kunde" }), 700);
  await pause(700);
  await typeSlow(page, page.getByPlaceholder("f.eks. Nordic Steel AS"), "Fjellheim Entreprenør AS", 500);
  await pause(250);
  await typeSlow(page, page.getByPlaceholder("Navn"), "Nora Fjell", 450);
  await pause(300);
  await clickAt(page, page.locator(".chip", { hasText: "Industri" }).first(), 500);
  await pause(400);
  await clickAt(page, page.getByRole("button", { name: "Opprett kunde" }), 550);
  await pause(1800);
  await page.keyboard.press("Escape").catch(() => {});
  await pause(600);

  // ---- Drag a card one stage forward ----
  try {
    const card = page.locator(".deal-card", { hasText: "Viken Handel" }).first();
    const target = page.locator(".deal-card", { hasText: "Trøndelag Marine" }).first();
    const src = await card.boundingBox();
    const dstBox = await target.boundingBox();
    if (src && dstBox) {
      await glide(page, src.x + src.width / 2, src.y + src.height / 2, 800);
      await pause(450);
      await page.mouse.down();
      await pause(260);
      const tx = dstBox.x + dstBox.width / 2;
      const ty = dstBox.y + dstBox.height * 0.7;
      const steps = 55;
      for (let i = 1; i <= steps; i++) {
        const t = easeInOut(i / steps);
        await page.mouse.move(
          src.x + src.width / 2 + (tx - src.x - src.width / 2) * t,
          src.y + src.height / 2 + (ty - src.y - src.height / 2) * t
        );
        await pause(18);
      }
      cur = { x: tx, y: ty };
      await pause(380);
      await page.mouse.up();
      await pause(1500);
    }
  } catch { await pause(1200); }

  // ---- Customer drawer: log a phone call, complete the next step ----
  try {
    await clickAt(page, page.locator(".deal-card", { hasText: "Fjord Logistikk" }).first(), 700);
    await pause(1500);
    await glide(page, 1000, 400, 450);
    for (let i = 0; i < 7; i++) { await page.mouse.wheel(0, 60); await pause(70); }
    await pause(800);
    await clickAt(page, page.getByRole("button", { name: "Telefon" }).first(), 550);
    await pause(1400);
    await clickAt(page, page.getByLabel("Lukk"), 550);
    await pause(700);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await pause(600);
  } catch { /* optional */ }

  // ---- Statistikk ----
  await clickAt(page, page.getByRole("link", { name: "Statistikk" }).first(), 700);
  await page.waitForLoadState("networkidle");
  await pause(1400);
  await clickAt(page, page.getByRole("button", { name: "Linje", exact: true }), 600);
  await pause(800);
  await clickAt(page, page.getByRole("button", { name: "Alt", exact: true }), 600);
  await pause(2200);

  // ---- Selgere: ranking + sorting ----
  await clickAt(page, page.getByRole("link", { name: "Selgere" }).first(), 700);
  await page.waitForLoadState("networkidle");
  await pause(1200);
  await clickAt(page, page.getByRole("button", { name: "Alt", exact: true }).first(), 500);
  await pause(1000);
  await clickAt(page, page.getByRole("button", { name: "Margin %", exact: true }), 600);
  await pause(1500);

  // ---- Kunder ----
  await clickAt(page, page.getByRole("link", { name: "Kunder" }).first(), 700);
  await page.waitForLoadState("networkidle");
  await pause(1300);
  await glide(page, 640, 520, 500);
  for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 60); await pause(80); }
  await pause(1100);

  // ---- Kalender (slutt) ----
  await clickAt(page, page.getByRole("link", { name: "Kalender" }).first(), 700);
  await page.waitForLoadState("networkidle");
  await pause(2200);

  // Stop: write the concat list with real frame durations
  await cdp.send("Page.stopScreencast").catch(() => {});
  await pause(300);
  const lines = [];
  for (let i = 0; i < stamps.length; i++) {
    const dur = i + 1 < stamps.length ? Math.max(0.001, stamps[i + 1] - stamps[i]) : 0.5;
    lines.push(`file 'frames/f${String(i).padStart(5, "0")}.jpg'`, `duration ${dur.toFixed(4)}`);
  }
  writeFileSync("scripts/out/concat.txt", lines.join(String.fromCharCode(10)) + String.fromCharCode(10));
  await ctx.close();
  await browser.close();
  console.log(`captured ${stamps.length} frames over ${(stamps[stamps.length-1]-stamps[0]).toFixed(1)}s`);
}

const c = await seed(admin);
try {
  await run();
} finally {
  await cleanup(admin, c);
  console.log("cleaned up demo org");
}
