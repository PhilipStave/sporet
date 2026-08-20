// Screenshot of the /setup page, filled in like a real signup (no submit). 2x, for the landing page.
import { chromium } from "playwright";

const BASE = process.env.SHOT_BASE || "http://localhost:3100";

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
  locale: "nb-NO",
});
const page = await ctx.newPage();
await page.goto(`${BASE}/setup`, { waitUntil: "networkidle" });

await page.fill('input[name="company"]', "Nordvik Maskin AS");
// two departments
const depts = page.locator('input[name="depts"]');
await depts.first().fill("Bane");
await page.getByText("Legg til avdeling").click();
await depts.nth(1).fill("Industri");
await page.getByText("Legg til avdeling").click();
await depts.nth(2).fill("Vei og miljø");

await page.fill('input[name="adminName"]', "Anders Vik");
await page.fill('input[name="adminEmail"]', "anders@nordvikmaskin.no");
await page.fill('input[name="adminPhone"]', "915 42 800");
await page.fill('input[name="password"]', "demo1234");
const pw2 = page.locator('input[placeholder="Gjenta passord"]');
if (await pw2.count()) await pw2.fill("demo1234");

await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(600);
await page.screenshot({ path: "public/screenshots/04-setup.png", fullPage: false });
console.log("shot public/screenshots/04-setup.png");
await browser.close();
