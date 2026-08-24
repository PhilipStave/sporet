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
  /** "AS", "ENK", "ASA"… Defaults to AS so we avoid sole traders (personal data). */
  organisasjonsform?: string;
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
  p.set("organisasjonsform", filter.organisasjonsform ?? "AS");
  p.set("size", String(size));
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
