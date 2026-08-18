// Takes crisp 2x screenshots of the real app for the landing page.
// Creates a throw-away demo org, logs in, shoots, then deletes everything.
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE = process.env.SHOT_BASE || "http://localhost:3000";
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

const email = "demo-shots@example.com";
const password = "demo1234";

// ---------- seed ----------
async function seed() {
  const { data: list } = await admin.auth.admin.listUsers();
  const prior = list.users.find((u) => u.email === email);
  if (prior) await admin.auth.admin.deleteUser(prior.id);
  const { data: old } = await admin.from("organizations").select("id").eq("name", "Nordvik Maskin AS");
  for (const o of old || []) await admin.from("organizations").delete().eq("id", o.id);

  const { data: c } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  const uid = c.user.id;
  const { data: org } = await admin.from("organizations").insert({ name: "Nordvik Maskin AS" }).select("id").single();
  const deptNames = ["Bane", "Bygg og betong", "Industri", "Vei og miljø"];
  const { data: depts } = await admin
    .from("departments")
    .insert(deptNames.map((name) => ({ org_id: org.id, name })))
    .select("id, name");
  await admin.from("profiles").insert({ id: uid, org_id: org.id, full_name: "Anders Vik", email, phone: "", role: "admin", status: "active" });
  const d = (n) => depts.find((x) => x.name === n).id;
  const days = (n) => new Date(Date.now() + n * 86400000).toISOString();
  const date = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

  const sellers = ["Anders Vik", "Mari Lund", "Petter Haugen", "Ida Sæther"];
  const rows = [
    ["Nordic Steel AS", "Kari Holt", "Innkjøpssjef", 450000, 18, "forhandling", "telefon", d("Industri"), sellers[0], -0, "Send revidert tilbud", date(0), "Stålkonstruksjoner"],
    ["Fjord Logistikk", "Ola Nyberg", "Driftsleder", 280000, 22, "tilbud", "epost", d("Vei og miljø"), sellers[1], -1, "Følg opp tilbud", date(2), "Transportløsning"],
    ["Bergen Data", "Ingrid Vik", "CTO", 620000, 15, "dialog", "mote", d("Industri"), sellers[2], -2, "Teknisk workshop", date(5), "Integrasjon"],
    ["Vestland Bygg", "Per Aas", "Prosjektleder", 190000, 25, "kontaktet", "telefon", d("Bygg og betong"), sellers[3], -3, "Ring tilbake", date(-1), "Betongelementer"],
    ["Oslo Konsult", "Mona Ruud", "Partner", 340000, 20, "ny", "epost", d("Bane"), sellers[0], 0, "Send introduksjon", date(1), "Rådgivning"],
    ["Trøndelag Marine", "Lars Berg", "Innkjøp", 510000, 17, "dialog", "sms", d("Industri"), sellers[1], -1, "Avklar behov", date(3), "Marineutstyr"],
    ["Kysten Eiendom", "Erik Sund", "Daglig leder", 720000, 24, "forhandling", "mote", d("Bygg og betong"), sellers[2], -1, "Kontraktsmøte", date(4), "Totalentreprise"],
    ["Aker Systemer", "Silje Moen", "IT-sjef", 410000, 19, "tilbud", "epost", d("Bane"), sellers[3], -4, "Purre på beslutning", date(-3), "Signalsystem"],
    ["Nordkraft AS", "Hanne Lie", "Innkjøpssjef", 260000, 21, "kontaktet", "sms", d("Vei og miljø"), sellers[0], -2, "Send kundecaser", date(6), "Veilys"],
    ["Viken Handel", "Jon Strand", "Kjøpssjef", 175000, 16, "ny", "epost", d("Bygg og betong"), sellers[1], 0, "Kvalifiser lead", date(2), "Lagerhall"],
    ["Polar Frakt", "Nina Dahl", "Logistikksjef", 95000, 28, "vunnet", "mote", d("Vei og miljø"), sellers[2], -6, null, null, "Fraktavtale"],
    ["Sør Elektro", "Tom Ness", "Eier", 130000, 12, "tapt", "telefon", d("Industri"), sellers[3], -10, null, null, "Elektro"],
    ["Hamar Bygg AS", "Eva Moe", "Innkjøp", 385000, 23, "vunnet", "epost", d("Bygg og betong"), sellers[0], -12, null, null, "Betongelementer"],
    ["Rogaland Bane", "Kim Sæter", "Prosjektsjef", 890000, 19, "vunnet", "mote", d("Bane"), sellers[1], -20, null, null, "Sporarbeid"],
    ["Midt-Norge Vei", "Ola Berg", "Driftssjef", 540000, 21, "vunnet", "telefon", d("Vei og miljø"), sellers[2], -35, null, null, "Asfaltering"],
    ["Industripark Øst", "Ane Lund", "Daglig leder", 1250000, 17, "vunnet", "mote", d("Industri"), sellers[3], -60, null, null, "Prosessanlegg"],
    ["Bergen Bane", "Siv Aas", "Innkjøpsleder", 670000, 20, "vunnet", "epost", d("Bane"), sellers[0], -95, null, null, "Kontaktledning"],
    ["Østfold Bygg", "Rune Hoel", "PL", 420000, 22, "vunnet", "telefon", d("Bygg og betong"), sellers[1], -140, null, null, "Prefab"],
  ];
  const now = Date.now();
  const inserts = rows.map(([company, contact, role, value, margin, stage, channel, dept, seller, off, nsText, nsDate, product]) => {
    const ts = new Date(now + off * 86400000).toISOString();
    return {
      org_id: org.id, department_id: dept, owner_id: uid, owner_name: seller,
      company, contact, contact_role: role, email: "", phone: "", product,
      value, margin_pct: margin, stage, channel, tags: [], notes: "",
      next_step_text: nsText, next_step_date: nsDate,
      created_by: uid, created_at: ts, updated_at: ts,
      won_at: stage === "vunnet" ? ts : null, lost_at: stage === "tapt" ? ts : null,
    };
  });
  const { data: deals } = await admin.from("deals").insert(inserts).select("id, company");
  // a few activities
  const acts = [];
  for (const dl of deals.slice(0, 8)) {
    acts.push({ deal_id: dl.id, org_id: org.id, actor_id: uid, actor_name: "Anders Vik", icon: "phone", label: "Telefon", note: "Gjennomgikk behov", created_at: days(-1) });
    acts.push({ deal_id: dl.id, org_id: org.id, actor_id: uid, actor_name: "Mari Lund", icon: "mail", label: "E-post", note: "Sendte tilbud", created_at: days(-3) });
  }
  await admin.from("activities").insert(acts);
  return { orgId: org.id, uid };
}

async function cleanup({ orgId, uid }) {
  await admin.from("organizations").delete().eq("id", orgId);
  await admin.auth.admin.deleteUser(uid).catch(() => {});
}

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
    // Line chart, year period, and only two departments + total for a clean look.
    await page.getByRole("button", { name: "Linje" }).click().catch(() => {});
    await page.getByRole("button", { name: "År", exact: true }).click().catch(() => {});
    await page.getByRole("button", { name: "Bygg og betong", exact: true }).click().catch(() => {});
    await page.getByRole("button", { name: "Vei og miljø", exact: true }).click().catch(() => {});
    await page.waitForTimeout(700);
  });
  await shot("/app/kunder", "03-app.png");

  await browser.close();
}

const ctx = await seed();
try {
  await shoot();
} finally {
  await cleanup(ctx);
  console.log("cleaned up demo org");
}
