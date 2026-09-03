import type { Anbud } from "./doffin";

// Lookup against Enhetsregisteret (Brønnøysundregistrene). Free, no API key.
// Every company we ever show a user comes from here — never from a language model.

const BASE = "https://data.brreg.no/enhetsregisteret/api/enheter";

export type LeadFilter = {
  /** SN2025 industry codes, e.g. ["43.120"]. At least one is required. */
  naeringskoder: string[];
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
  };
}

function buildUrl(filter: LeadFilter, kode: string, size: number) {
  const p = new URLSearchParams();
  p.set("naeringskode", kode);
  const former = filter.organisasjonsformer?.length ? filter.organisasjonsformer : ["AS"];
  former.forEach((f) => p.append("organisasjonsform", f));
  p.set("size", String(size));
  // Biggest first. Without this the register returns alphabetically, which means
  // the same handful of "123 …" companies for every single search.
  p.set("sort", "antallAnsatte,DESC");
  if (filter.fraAntallAnsatte != null) p.set("fraAntallAnsatte", String(filter.fraAntallAnsatte));
  if (filter.tilAntallAnsatte != null) p.set("tilAntallAnsatte", String(filter.tilAntallAnsatte));
  (filter.kommunenummer ?? []).forEach((k) => p.append("kommunenummer", k));
  return `${BASE}?${p.toString()}`;
}

/**
 * One request per industry code (the register takes a single code per query),
 * then merged and de-duplicated on org number.
 */
export async function searchCompanies(
  filter: LeadFilter,
  limit = 40
): Promise<{ leads: Lead[]; total: number }> {
  const koder = filter.naeringskoder.slice(0, 4);
  if (koder.length === 0) return { leads: [], total: 0 };

  const perKode = Math.max(10, Math.ceil(limit / koder.length));
  const results = await Promise.all(
    koder.map(async (kode) => {
      try {
        const res = await fetch(buildUrl(filter, kode, perKode), {
          headers: { Accept: "application/json" },
          next: { revalidate: 3600 },
        });
        if (!res.ok) return { enheter: [] as BrregEnhet[], total: 0 };
        const json = await res.json();
        return {
          enheter: (json?._embedded?.enheter ?? []) as BrregEnhet[],
          total: (json?.page?.totalElements ?? 0) as number,
        };
      } catch {
        return { enheter: [] as BrregEnhet[], total: 0 };
      }
    })
  );

  const seen = new Set<string>();
  const leads: Lead[] = [];
  for (const r of results) {
    for (const e of r.enheter) {
      // Skip anything bankrupt or winding down — nobody wants those as leads.
      if (e.konkurs === true || e.underAvvikling === true) continue;
      if (seen.has(e.organisasjonsnummer)) continue;
      seen.add(e.organisasjonsnummer);
      leads.push(toLead(e));
    }
  }

  // Biggest first — employee count is the closest thing to "worth calling".
  leads.sort((a, b) => (b.ansatte ?? 0) - (a.ansatte ?? 0));

  return {
    leads: leads.slice(0, limit),
    total: results.reduce((n, r) => n + r.total, 0),
  };
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
  // A real hostname: at least one dot, no spaces, plausible TLD.
  if (!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(vert)) return null;

  // Small companies often register a page on somebody else's platform. There
  // the path is the company and the host is not — dropping the path leaves us
  // pointing at Facebook, and the caller would then trust facebook.com as this
  // company's own confirmed site and harvest whatever mailbox it finds there.
  const sti = uten.slice(vert.length).replace(/^\/+/, "").split(/[?#]/)[0];
  if (sti.length > 0 && DELT_VERT.some((d) => vert === d || vert.endsWith("." + d))) {
    return null;
  }
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
