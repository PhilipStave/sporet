// Finds a company's public contact details from its own website.
//
// Three rules, all deliberate:
//   1. General mailboxes only (post@, firmapost@, salg@ …). Named individuals
//      are personal data under GDPR and are dropped, even when published.
//   2. The address must sit on the same domain we derived from the company
//      name. Testing showed Norwegian sites almost never publish their org
//      number, so that cannot be the check — but post@2bygg.no found on
//      2bygg.no, reached from "2 BYGG AS", takes two coincidences to be wrong.
//   3. A name match in the page title raises confidence to "bekreftet".

export type Kontakt = {
  domene: string | null;
  epost: string | null;
  telefon: string | null;
  sikkerhet: "bekreftet" | "usikker" | "ingen";
};

export const TOM_KONTAKT: Kontakt = {
  domene: null,
  epost: null,
  telefon: null,
  sikkerhet: "ingen",
};
const TOM = TOM_KONTAKT;

const SUFFIKS = new Set([
  "as", "asa", "ans", "da", "ba", "sa", "nuf", "ab", "oy", "aps", "gmbh",
  "kommune", "fylkeskommune", "holding", "gruppen", "group", "norge", "norway",
]);

// Mailboxes that belong to the company rather than to a person.
//
// Every entry has to be a role, never something that could be a first name —
// a named individual's address is personal data and stays out, however openly
// it is published. The list grows from real misses: Avonova publishes
// kundesenter@ on its front page, and we threw it away because only
// kundeservice@ was listed. Municipalities almost all use postmottak@.
const GENERELLE = new Set([
  "post", "postmottak", "firmapost", "kontakt", "salg", "salgs", "info",
  "mail", "epost", "hei", "hallo", "resepsjon", "sentralbord", "adm",
  "administrasjon", "office", "sales", "contact", "kundeservice",
  "kundesenter", "kundesupport", "support", "service", "bestilling", "ordre",
  "booking", "faktura", "regnskap", "tilbud", "anbud", "marked", "teknisk",
  "hello", "enquiries",
]);

// /personvern earns its place: often the only page carrying firmapost@.
const SIDER = ["", "/kontakt", "/kontakt-oss", "/personvern", "/om-oss", "/contact"];

function reneOrd(navn: string) {
  return navn
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/&/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((w) => w && w !== "og" && !SUFFIKS.has(w));
}

/** Domain candidates, most likely first. */
export function domeneKandidater(navn: string): string[] {
  const ord = reneOrd(navn);
  if (ord.length === 0) return [];
  const ut = new Set<string>();
  ut.add(ord.join("") + ".no");
  if (ord.length > 1) ut.add(ord.join("-") + ".no");
  if (ord[0].length >= 4) ut.add(ord[0] + ".no");
  return [...ut].filter((d) => d.length <= 40).slice(0, 3);
}

function harOrgnr(html: string, orgnr: string) {
  return html.replace(/[^0-9]/g, "").includes(orgnr);
}

const TITTEL = /<title[^>]*>([\s\S]*?)<\/title>/i;

/** Does the page title actually name this company? */
/**
 * How much of the company name the page title carries back.
 *
 * One word used to be enough. That let "CITY ROAD AS" confirm itself on
 * city.no — a site belonging to someone else entirely, whose title naturally
 * contains "city". A wrong address is worse than none: the seller mails a
 * stranger and never learns why nobody answered. So the count is returned and
 * the caller decides how much it needs, based on how risky the domain guess was.
 */
function ordITittel(html: string, navn: string) {
  const tittel = (html.match(TITTEL)?.[1] ?? "").toLowerCase();
  if (!tittel) return 0;
  return reneOrd(navn).filter((w) => w.length >= 3 && tittel.includes(w)).length;
}

function finnEpost(html: string, domene: string): string | null {
  const treff = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? [];
  const rot = domene.replace(/^www\./, "");

  for (const raa of treff) {
    const e = raa.toLowerCase();
    if (/\.(png|jpe?g|gif|svg|webp|css|js)$/.test(e)) continue;
    const [lokal, vert] = e.split("@");
    // Never "ola.nordmann@", and never an address on somebody else's domain.
    if (!GENERELLE.has(lokal)) continue;
    if (vert !== rot && !vert.endsWith("." + rot)) continue;
    return e;
  }
  return null;
}

function finnTelefon(html: string): string | null {
  // Only numbers the site itself marked as a phone link — free-text digits are
  // just as likely to be an account or invoice number.
  for (const m of html.matchAll(/href=["']tel:([^"']+)["']/gi)) {
    const bare = m[1].replace(/[^0-9]/g, "").replace(/^0047/, "").replace(/^47(?=\d{8}$)/, "");
    if (bare.length === 8) return bare.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4");
  }
  return null;
}

async function hent(url: string, ms: number): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "user-agent": "AltivKundesok/1.0 (+https://altiv.no)" },
      next: { revalidate: 604800 },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    if (!(res.headers.get("content-type") ?? "").includes("text/html")) return null;
    // Contact details live near the top and in the footer; 400 kB is plenty.
    return (await res.text()).slice(0, 400_000);
  } catch {
    return null;
  }
}

/**
 * Best-effort lookup. Returns nothing rather than a guess whenever the site
 * cannot be tied back to the company.
 *
 * `registrert` is the website the company itself reported to Brønnøysund.
 * Roughly six in ten have one, and it needs no name matching to be trusted —
 * guessing a domain from the company name is the fallback, not the plan.
 */
export async function finnKontakt(
  navn: string,
  orgnr: string,
  registrert?: string | null
): Promise<Kontakt> {
  const ord = reneOrd(navn).filter((w) => w.length >= 3);

  // The registered site goes first, and the guessed ones only if it fails.
  const fraRegisteret = (registrert ?? "").trim().toLowerCase() || null;
  const kandidater = fraRegisteret
    ? [fraRegisteret, ...domeneKandidater(navn).filter((d) => d !== fraRegisteret)]
    : domeneKandidater(navn);

  for (const domene of kandidater) {
    const erRegistrert = domene === fraRegisteret;
    // The candidate built from the first word alone is the risky one: for a
    // multi-word name it can land on a generic domain that has nothing to do
    // with the company. Such a guess has to bring back the rest of the name
    // before it counts as the right site.
    const gjettetPaaEttOrd = !erRegistrert && ord.length > 1 && domene === `${ord[0]}.no`;
    const kreves = gjettetPaaEttOrd ? 2 : 1;

    const forside = await hent(`https://${domene}`, 6000);
    if (!forside) continue;

    let orgnrTreff = harOrgnr(forside, orgnr);
    let treff = ordITittel(forside, navn);
    let epost = finnEpost(forside, domene);
    let telefon = finnTelefon(forside);

    // The front page rarely carries everything.
    for (const sti of SIDER.slice(1)) {
      if (epost && telefon) break;
      const side = await hent(`https://${domene}${sti}`, 5000);
      if (!side) continue;
      orgnrTreff = orgnrTreff || harOrgnr(side, orgnr);
      treff = Math.max(treff, ordITittel(side, navn));
      epost = epost ?? finnEpost(side, domene);
      telefon = telefon ?? finnTelefon(side);
    }

    // The register is proof in itself, as is the org number on the page; the
    // title is only evidence.
    const sikker = erRegistrert || orgnrTreff || treff >= kreves;
    if (gjettetPaaEttOrd && !sikker) continue;
    // A registered site with no contact details still tells the seller where
    // the company lives — worth returning even when the mailbox hunt failed.
    if (!epost && !telefon && !erRegistrert) continue;

    return {
      domene,
      epost,
      telefon,
      sikkerhet: sikker ? "bekreftet" : "usikker",
    };
  }

  return TOM;
}
