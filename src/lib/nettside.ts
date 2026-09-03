import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

// Vurderer én bedrifts nettside fra forsiden alene. Bare signaler som ga null
// falske «dårlig» på 42 mellomstore bedrifter (2026-09-03) er med; alt annet
// er «ukjent». En feil dom er verre enn ingen — det var eierens klage.

export type NettsideStatus =
  | "hentet"          // forsiden ble lest
  | "mangler"         // registrert domene finnes ikke (DNS) eller svarer verken på https/http
  | "blokkert"        // 403/429/503 — bot-vern, sier ingenting om kvalitet
  | "ukjent"          // tidsavbrudd, tomt svar, ikke-HTML
  | "ingen_registrert"; // bedriften har ikke oppgitt nettside

export type NettsideMeta = {
  status: NettsideStatus;
  via: "https" | "http";
  sistEndret: Date | null;
  /** Hva som faktisk ble hentet (etter redirect/meta-refresh). */
  url: string | null;
};

export type NettsideDom = "mangler" | "daarlig" | "svak" | "ok" | "ukjent" | "ingen_registrert";

export type Nettsidevurdering = {
  poeng: number;
  dom: NettsideDom;
  funn: string[];
};

const UA = "AltivKundesok/1.0 (+https://altiv.no)";
const MAKS_BYTES = 400_000;

function synligTekst(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Domeneshop skriver «x.no is parked» / «in parked», One.com «Parked», norske
// registrarer «Domenet er parkert». Kombinert med HTML < 10 kB: 0 falske på 47.
const PARKERT =
  /((is|in) parked|^parked\b|parked domain|domain (is )?for sale|buy this domain|is registered, but the owner|domenet? (er|is) (parkert|reservert|til salgs)|kjøp dette domenet|under konstruksjon|under construction|coming soon|kommer snart|siden er under arbeid)/i;

// Hele generatornavn — /word/ alene treffer «WordPress».
const GAMMEL_GENERATOR =
  /<meta[^>]+name=["']generator["'][^>]+content=["'](iweb|microsoft frontpage|microsoft word|adobe golive|netobjects fusion|dreamweaver|macromedia)/i;

export function domAv(poeng: number, status: NettsideStatus): NettsideDom {
  if (status === "ingen_registrert") return "ingen_registrert";
  if (status === "mangler") return "mangler";
  if (status !== "hentet") return "ukjent";
  if (poeng >= 5) return "daarlig";
  if (poeng >= 2) return "svak";
  return "ok";
}

export function vurderNettside(
  html: string | null,
  url: string,
  meta: NettsideMeta
): Nettsidevurdering {
  const funn: string[] = [];
  let poeng = 0;

  if (meta.status === "ingen_registrert")
    return { poeng: 0, dom: "ingen_registrert", funn: ["Har ikke oppgitt nettside til Brønnøysund"] };
  if (meta.status === "mangler")
    return { poeng: 0, dom: "mangler", funn: ["Nettsiden bedriften har oppgitt finnes ikke lenger"] };
  if (meta.status === "blokkert")
    return { poeng: 0, dom: "ukjent", funn: ["Nettsiden avviste henvendelsen — ikke vurdert"] };
  if (meta.status === "ukjent" || html == null || html.length === 0)
    return { poeng: 0, dom: "ukjent", funn: ["Ikke vurdert"] };

  const tekst = synligTekst(html);
  const harEksterneSkript = /<script[^>]+src=/i.test(html);

  if (html.length < 10_000 && PARKERT.test(tekst)) {
    poeng += 6;
    funn.push("Domenet er parkert eller siden er «under arbeid»");
  } else if (tekst.length < 120 && harEksterneSkript) {
    // SPA-skall (jns.no): innholdet bygges i nettleseren. Ikke dømmelig herfra.
    return { poeng: 0, dom: "ukjent", funn: ["Siden bygges i nettleseren — kan ikke vurderes fra HTML"] };
  } else if (tekst.length < 120) {
    poeng += 4;
    funn.push("Forsiden har nesten ikke innhold");
  }

  if (meta.via === "http") {
    poeng += 3;
    funn.push("Nettsiden virker ikke på https");
  }

  if (!/<meta[^>]+name=["']viewport["']/i.test(html)) {
    poeng += 3;
    funn.push("Ikke tilpasset mobil (mangler viewport)");
  }

  const gen = html.match(GAMMEL_GENERATOR);
  if (gen) {
    poeng += 3;
    funn.push(`Laget med utdatert verktøy (${gen[1]})`);
  }

  const doctype = html.slice(0, 400).match(/<!doctype[^>]*>/i)?.[0] ?? "";
  if (!doctype || /public|dtd/i.test(doctype)) {
    poeng += 1;
    funn.push(doctype ? "Gammel HTML-standard" : "Mangler doctype");
  }

  const lav = html.toLowerCase();
  if (
    /<(frameset|marquee|blink)\b/.test(lav) ||
    /<font\b[^>]*face=/.test(lav) ||
    /<table[^>]+(bgcolor|cellpadding)=/.test(lav)
  ) {
    poeng += 2;
    funn.push("Gammeldags HTML (rammer, font-tagger eller tabell-layout)");
  }

  if (meta.sistEndret) {
    const aar = (Date.now() - meta.sistEndret.getTime()) / (365.25 * 86_400_000);
    if (aar > 3) {
      poeng += 1;
      funn.push(`Sist endret for ${Math.floor(aar)} år siden`);
    }
  }

  return { poeng, dom: domAv(poeng, meta.status), funn };
}

// ---------------------------------------------------------------
// Henting: https først, http ved alle feil unntatt vårt eget tidsavbrudd,
// én meta-refresh, SSRF-vern på hvert hopp.
// ---------------------------------------------------------------

function privatAdresse(ip: string) {
  if (isIP(ip) === 6) return /^(::1$|::ffff:|fc|fd|fe80)/i.test(ip);
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 10 || a === 127 || a === 0 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

/** Kaster {code:"ENOTFOUND"} når navnet ikke finnes, {code:"PRIVAT"} når det peker innover. */
async function sjekkVert(vert: string) {
  if (isIP(vert)) {
    if (privatAdresse(vert)) throw Object.assign(new Error("privat"), { code: "PRIVAT" });
    return;
  }
  const { address } = await lookup(vert); // kaster ENOTFOUND/EAI_AGAIN
  if (privatAdresse(address)) throw Object.assign(new Error("privat"), { code: "PRIVAT" });
}

type Raa = { ok: boolean; status: number; html: string; lm: string | null; url: string };

async function hentRaa(url: string, ms: number, hopp = 0): Promise<Raa> {
  const u = new URL(url);
  await sjekkVert(u.hostname);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(u.toString(), {
      signal: ctrl.signal,
      redirect: "manual",
      headers: { "user-agent": UA, accept: "text/html" },
      cache: "no-store", // caches i nettsted-tabellen, ikke i Next (2 MB-grensen)
    });
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const til = res.headers.get("location");
      if (!til || hopp >= 3) return { ok: false, status: res.status, html: "", lm: null, url };
      clearTimeout(t);
      return hentRaa(new URL(til, u).toString(), ms, hopp + 1);
    }
    const ct = res.headers.get("content-type") ?? "";
    const html = ct.includes("text/html") ? (await res.text()).slice(0, MAKS_BYTES) : "";
    return { ok: res.ok, status: res.status, html, lm: res.headers.get("last-modified"), url: u.toString() };
  } finally {
    clearTimeout(t);
  }
}

const kode = (e: unknown) => (e as { code?: string; cause?: { code?: string }; name?: string });

export async function hentForside(
  domene: string,
  ms = 6000
): Promise<{ meta: NettsideMeta; html: string | null }> {
  const tom = (status: NettsideStatus, via: "https" | "http" = "https"): { meta: NettsideMeta; html: null } =>
    ({ meta: { status, via, sistEndret: null, url: null }, html: null });

  let via: "https" | "http" = "https";
  let r: Raa;
  try {
    r = await hentRaa(`https://${domene}/`, ms);
  } catch (e) {
    const k = kode(e);
    const c = k.code ?? k.cause?.code ?? "";
    if (k.name === "AbortError") return tom("ukjent");
    if (c === "PRIVAT") return tom("ukjent");
    if (c === "ENOTFOUND" || c === "EAI_AGAIN") return tom("mangler");
    // TLS-feil, ETIMEDOUT på socket, ECONNREFUSED, ECONNRESET → prøv http
    try {
      via = "http";
      r = await hentRaa(`http://${domene}/`, ms);
    } catch (e2) {
      const k2 = kode(e2);
      if (k2.name === "AbortError" || (k2.code ?? k2.cause?.code) === "PRIVAT") return tom("ukjent", via);
      return tom("mangler", via);
    }
  }

  if ([403, 429, 503].includes(r.status)) return tom("blokkert", via);
  if (r.status === 404 || r.status === 410) return tom("mangler", via);
  if (!r.ok || r.html.length === 0) return tom("ukjent", via);

  // aacon.no: 311 byte forside med content="0;url= Velkommen.html" (mellomrom).
  const mr = r.html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"']*url\s*=\s*([^"'\s>]+)/i);
  if (mr && r.html.length < 2_000) {
    try {
      const r2 = await hentRaa(new URL(mr[1], r.url).toString(), ms);
      if (r2.ok && r2.html) r = r2;
    } catch { /* behold forsiden */ }
  }

  const lm = r.lm && !Number.isNaN(Date.parse(r.lm)) ? new Date(r.lm) : null;
  return { meta: { status: "hentet", via, sistEndret: lm, url: r.url }, html: r.html };
}

/** Alt i ett: hent og vurder. Aldri kast. */
export async function sjekkNettside(domene: string | null, ms = 6000): Promise<Nettsidevurdering & { meta: NettsideMeta }> {
  if (!domene) {
    const meta: NettsideMeta = { status: "ingen_registrert", via: "https", sistEndret: null, url: null };
    return { ...vurderNettside(null, "", meta), meta };
  }
  try {
    const { meta, html } = await hentForside(domene, ms);
    return { ...vurderNettside(html, `https://${domene}/`, meta), meta };
  } catch {
    const meta: NettsideMeta = { status: "ukjent", via: "https", sistEndret: null, url: null };
    return { ...vurderNettside(null, "", meta), meta };
  }
}

/**
 * A page as text, or null — for callers that only want the HTML and already
 * have their own idea of what to do with it (the contact lookup). Same
 * redirect limit and same private-address guard as everything above, so a
 * company that registers a site redirecting to 127.0.0.1 gets nothing.
 */
export async function hentHtml(url: string, ms: number): Promise<string | null> {
  try {
    const r = await hentRaa(url, ms);
    if (!r.ok || !r.html) return null;
    return r.html;
  } catch {
    return null;
  }
}
