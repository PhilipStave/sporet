// Takes crisp 2x screenshots of the real app for the landing page.
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { seed, cleanup, email, password } from "./demo-data.mjs";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE = process.env.SHOT_BASE || "http://localhost:3000";
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

// ---------- shoot ----------
async function shoot() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
    locale: "nb-NO",
  });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/app\//, { timeout: 30000 });
  await page.waitForTimeout(1200);

  const shot = async (path, file, extra) => {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    if (extra) await extra();
    await page.screenshot({ path: `public/screenshots/${file}`, fullPage: false });
    console.log("shot", file);
  };

  await shot("/app/oversikt", "02-app-oversikt.png");
  await shot("/app/pipeline", "01-app.png");
  await shot("/app/statistikk", "02-app.png", async () => {
    // Line chart (cumulative), last 12 months, all departments, total off.
    await page.getByRole("button", { name: "Linje" }).click().catch(() => {});
    await page.getByRole("button", { name: "Alt", exact: true }).click().catch(() => {});
    await page.getByRole("button", { name: "Alle (total)", exact: true }).click().catch(() => {});
    await page.waitForTimeout(700);
  });
  await shot("/app/kunder", "03-app.png");
  await shot("/app/kalender", "05-kalender.png");
  await shot("/app/selgere", "06-selgere.png", async () => {
    await page.getByRole("button", { name: "Alt", exact: true }).click().catch(() => {});
    await page.waitForTimeout(500);
  });

  await browser.close();
}

const ctx = await seed(admin);
try {
  await shoot();
} finally {
  await cleanup(admin, ctx);
  console.log("cleaned up demo org");
}
