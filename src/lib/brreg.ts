import type { Anbud } from "./doffin";
import type { NettsideDom } from "./nettside";

// Lookup against Enhetsregisteret (Brønnøysundregistrene). Free, no API key.
// Every company we ever show a user comes from here — never from a language model.

const BASE = "https://data.brreg.no/enhetsregisteret/api/enheter";

export type LeadFilter = {
  /**
   * SN2025 industry codes, e.g. ["43.120"]. May be empty when the search is
   * about something at the company itself (its website, its age) rather than
   * what it does — then a place or a size range has to narrow it instead.
   */
  naeringskoder?: string[];
  /** Only companies that registered a website. Maps to hjemmeside=. */
  harHjemmeside?: boolean;
  /**
   * Biggest first is the default and the reason every search used to open on
   * the country's largest companies — who also have the best websites.
   */
  sortering?: "storst" | "eldst" | "nyest";
  /** Municipality numbers, e.g. ["4601"]. Empty means all of Norway. */
  kommunenummer?: string[];
  fraAntallAnsatte?: number;
  tilAntallAnsatte?: number;
  /**
   * "AS", "KOMM", "FYLK"… Defaults to AS alone, which keeps sole traders (and
   * therefore personal names) out. Public-sector targets need KOMM/FYLK, since
   * a municipality is not a limited company.
   */
  organisasjonsformer?: string[];
};

export type Lead = {
  orgnr: string;
  navn: string;
  form: string;
  naeringskode: string;
  naering: string;
  ansatte: number | null;
  poststed: string;
  kommune: string;
  adresse: string;
  registrert: string | null;
  mva: boolean;
  /** Website as registered with Brønnøysund, reduced to a hostname. */
  hjemmeside?: string | null;
  /** Contact details the company itself gave the register. Often empty. */
  epost?: string | null;
  telefon?: string | null;
  /** The register's free-text description of what the company does. */
  aktivitet?: string;
  /** Measured, never guessed. Only set when the search asked about websites. */
  nettside?: { dom: NettsideDom; funn: string[] };
  /** One line from the relevance pass on why this hit fits the query. */
  hvorfor?: string;
  /** Set when this company has an open Doffin notice matching the search. */
  /**
   * The whole notice, not a summary. The card used to get only title, deadline
   * and link — enough to show a badge, not enough to follow the tender when the
   * plus was pressed, so the tender was lost the moment the company was added.
   */
  anbud?: Anbud;
};

type BrregEnhet = {
  organisasjonsnummer: string;
  navn: string;
  organisasjonsform?: { kode?: string };
  naeringskode1?: { kode?: string; beskrivelse?: string };
  antallAnsatte?: number;
  registrertIMvaregisteret?: boolean;
  registreringsdatoEnhetsregisteret?: string;
  hjemmeside?: string;
  epostadresse?: string;
  telefon?: string;
  mobil?: string;
  aktivitet?: string[];
  vedtektsfestetFormaal?: string[];
  konkurs?: boolean;
  underAvvikling?: boolean;
  forretningsadresse?: {
    poststed?: string;
    kommune?: string;
    kommunenummer?: string;
    postnummer?: string;
    adresse?: string[];
  };
};

function toLead(e: BrregEnhet): Lead {
  return {
    orgnr: e.organisasjonsnummer,
    navn: e.navn,
    form: e.organisasjonsform?.kode ?? "",
    naeringskode: e.naeringskode1?.kode ?? "",
    naering: e.naeringskode1?.beskrivelse ?? "",
    ansatte: typeof e.antallAnsatte === "number" ? e.antallAnsatte : null,
    poststed: e.forretningsadresse?.poststed ?? "",
    kommune: e.forretningsadresse?.kommune ?? "",
    adresse: (e.forretningsadresse?.adresse ?? []).filter(Boolean).join(", "),
    registrert: e.registreringsdatoEnhetsregisteret ?? null,
    mva: e.registrertIMvaregisteret === true,
    hjemmeside: reisDomene(e.hjemmeside),
    epost: (e.epostadresse ?? "").trim().toLowerCase() || null,
    telefon: (e.telefon ?? e.mobil ?? "").trim() || null,
    aktivitet: (e.aktivitet ?? []).join(" ").trim() || (e.vedtektsfestetFormaal ?? []).join(" ").trim(),
  };
}

function buildUrl(filter: LeadFilter, size: number) {
  const p = new URLSearchParams();
  // The register takes several codes in one request, comma-separated. One
  // call instead of four, and no per-code cap on how many come back.
  const koder = (filter.naeringskoder ?? []).slice(0, 4);
  if (koder.length) p.set("naeringskode", koder.join(","));
  if (filter.harHjemmeside) p.set("hjemmeside", ".");
  const former = filter.organisasjonsformer?.length ? filter.organisasjonsformer : ["AS"];
  former.forEach((f) => p.append("organisasjonsform", f));
  p.set("size", String(size));
  // Biggest first by default — without a sort the register goes alphabetically
  // and every search opens on the same "123 …" companies. Oldest first is for
  // website searches: an old company with a registered site is the one whose
  // site is old too.
  const sort =
    filter.sortering === "eldst"
      ? "registreringsdatoEnhetsregisteret,ASC"
      : filter.sortering === "nyest"
        ? "registreringsdatoEnhetsregisteret,DESC"
        : "antallAnsatte,DESC";
  p.set("sort", sort);
  if (filter.fraAntallAnsatte != null) p.set("fraAntallAnsatte", String(filter.fraAntallAnsatte));
  if (filter.tilAntallAnsatte != null) p.set("tilAntallAnsatte", String(filter.tilAntallAnsatte));
  (filter.kommunenummer ?? []).forEach((k) => p.append("kommunenummer", k));
  return `${BASE}?${p.toString()}`;
}

/**
 * One request to the register. Without industry codes the search has to be
 * narrowed some other way — a place or a size — or it would be all of Norway.
 */
export async function searchCompanies(
  filter: LeadFilter,
  limit = 40
): Promise<{ leads: Lead[]; total: number }> {
  const koder = (filter.naeringskoder ?? []).slice(0, 4);
  const avgrenset =
    (filter.kommunenummer?.length ?? 0) > 0 ||
    filter.fraAntallAnsatte != null ||
    filter.tilAntallAnsatte != null;
  if (koder.length === 0 && !avgrenset) return { leads: [], total: 0 };

  let enheter: BrregEnhet[] = [];
  let total = 0;
  try {
    const res = await fetch(buildUrl(filter, Math.min(Math.max(limit, 10), 100)), {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      enheter = (json?._embedded?.enheter ?? []) as BrregEnhet[];
      total = (json?.page?.totalElements ?? 0) as number;
    }
  } catch {
    // The register being down is an empty result, not a crash.
  }

  const kodesett = new Set(koder);
  const seen = new Set<string>();
  const leads: Lead[] = [];
  for (const e of enheter) {
    // Skip anything bankrupt or winding down — nobody wants those as leads.
    if (e.konkurs === true || e.underAvvikling === true) continue;
    // The register matches on secondary codes too, which is how a hotel chain
    // turns up in a search for restaurants. The main code has to be the one.
    if (kodesett.size && !kodesett.has(e.naeringskode1?.kode ?? "")) continue;
    if (seen.has(e.organisasjonsnummer)) continue;
    seen.add(e.organisasjonsnummer);
    leads.push(toLead(e));
  }

  // Biggest first only when that is the order asked for; otherwise the
  // register's own order (by age) is the point.
  if (!filter.sortering || filter.sortering === "storst")
    leads.sort((a, b) => (b.ansatte ?? 0) - (a.ansatte ?? 0));

  return { leads: leads.slice(0, limit), total };
}

/**
 * The register stores whatever the company typed: "www.mesta.no",
 * "https://mesta.no/", sometimes an e-mail address or plain nonsense. Reduce
 * it to a bare hostname, or null when it is not one.
 */
function reisDomene(raa: string | undefined): string | null {
  const s = (raa ?? "").trim().toLowerCase();
  if (!s || s.includes("@")) return null;
  const uten = s.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const vert = uten.split(/[/?#]/)[0].trim();
  // A real hostname: at least one dot, no spaces, plausible TLD. Norwegian
  // letters are allowed — fetch punycodes them, and "blåbær.no" is a live site.
  if (!/^[a-z0-9æøå][a-z0-9æøå.-]*\.[a-z]{2,}$/.test(vert)) return null;

  // Small companies often register a page on somebody else's platform. There
  // the path is the company and the host is not — dropping the path leaves us
  // pointing at Facebook, and the caller would then trust facebook.com as this
  // company's own confirmed site and harvest whatever mailbox it finds there.
  // A shared host is never the company's own site, with or without a path:
  // "facebook.com" on its own used to slip through and get scraped for a
  // mailbox as if it belonged to the company.
  if (DELT_VERT.some((d) => vert === d || vert.endsWith("." + d))) return null;
  return vert;
}

/** Platforms where a path, not the host, identifies the company. */
const DELT_VERT = [
  "facebook.com", "instagram.com", "linkedin.com", "x.com", "twitter.com",
  "youtube.com", "google.com", "sites.google.com", "wordpress.com",
  "blogspot.com", "wix.com", "wixsite.com", "squarespace.com", "weebly.com",
  "webnode.no", "123hjemmeside.no", "one.com", "proff.no", "gulesider.no",
  "finn.no", "1881.no",
];

export type LeadDetail = Lead & {
  stiftet: string | null;
  formaal: string;
  aktivitet: string;
  postnummer: string;
  kommunenummer: string;
  konsern: boolean;
  /** Website as the company itself reported it to Brønnøysund, if any. */
  hjemmeside: string | null;
};

/**
 * Full record for one company, fetched when the user actually picks it. The
 * register holds no e-mail or phone, but roughly six in ten companies do
 * register their own website — that field is worth far more than a guess,
 * because the company put it there itself.
 */
export async function fetchCompany(orgnr: string): Promise<LeadDetail | null> {
  try {
    const res = await fetch(`${BASE}/${encodeURIComponent(orgnr)}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const e = (await res.json()) as BrregEnhet & {
      stiftelsesdato?: string;
      vedtektsfestetFormaal?: string[];
      aktivitet?: string[];
      erIKonsern?: boolean;
      hjemmeside?: string;
    };
    return {
      ...toLead(e),
      stiftet: e.stiftelsesdato ?? null,
      formaal: (e.vedtektsfestetFormaal ?? []).join(" ").trim(),
      aktivitet: (e.aktivitet ?? []).join(" ").trim(),
      postnummer: e.forretningsadresse?.postnummer ?? "",
      kommunenummer: e.forretningsadresse?.kommunenummer ?? "",
      konsern: e.erIKonsern === true,
      hjemmeside: reisDomene(e.hjemmeside),
    };
  } catch {
    return null;
  }
}

export type Regnskap = {
  aar: number;
  omsetning: number | null;
  driftsresultat: number | null;
  aarsresultat: number | null;
};

type RegnskapRad = {
  regnskapsperiode?: { fraDato?: string; tilDato?: string };
  resultatregnskapResultat?: {
    aarsresultat?: number;
    driftsresultat?: {
      driftsinntekter?: { sumDriftsinntekter?: number };
      driftsresultat?: number;
    };
  };
};

/**
 * Latest filed accounts from Regnskapsregisteret. Public company figures, and
 * the fastest way for a seller to judge whether a lead is worth the trip.
 * Small companies and fresh registrations often have nothing filed — that is
 * normal, and returns null rather than an error.
 */
export async function fetchRegnskap(orgnr: string): Promise<Regnskap | null> {
  try {
    const res = await fetch(
      `https://data.brreg.no/regnskapsregisteret/regnskap/${encodeURIComponent(orgnr)}`,
      { headers: { Accept: "application/json" }, next: { revalidate: 604800 } }
    );
    if (!res.ok) return null;
    const rader = (await res.json()) as RegnskapRad[];
    if (!Array.isArray(rader) || rader.length === 0) return null;

    // The register may return several filings; take the most recent period.
    const nyeste = rader
      .filter((r) => r.regnskapsperiode?.tilDato)
      .sort((a, b) =>
        (b.regnskapsperiode!.tilDato ?? "").localeCompare(a.regnskapsperiode!.tilDato ?? "")
      )[0];
    if (!nyeste) return null;

    const r = nyeste.resultatregnskapResultat;
    const aar = Number((nyeste.regnskapsperiode?.tilDato ?? "").slice(0, 4));
    if (!Number.isFinite(aar)) return null;

    return {
      aar,
      omsetning: r?.driftsresultat?.driftsinntekter?.sumDriftsinntekter ?? null,
      driftsresultat: r?.driftsresultat?.driftsresultat ?? null,
      aarsresultat: r?.aarsresultat ?? null,
    };
  } catch {
    return null;
  }
}
