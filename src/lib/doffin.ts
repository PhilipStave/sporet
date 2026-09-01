// Active public tenders from Doffin — the buyers who are looking right now.
//
// The industry-code search finds companies that exist; Doffin shows demand:
// a municipality announcing a competition for road sweepers is a buyer with a
// budget and a deadline. The endpoint is the same open, unauthenticated one
// Doffin's own website uses, the data is public procurement notices published
// to be read, and every query here is user-triggered and cached — we are a
// polite guest, not a crawler.

export type Anbud = {
  id: string;
  tittel: string;
  beskrivelse: string;
  kjoperNavn: string;
  kjoperOrgnr: string | null;
  verdi: number | null;
  frist: string | null;
  publisert: string | null;
  /** Absolute link to the notice on doffin.no. */
  lenke: string;
};

type DoffinHit = {
  id?: string;
  heading?: string;
  description?: string;
  buyer?: { name?: string; organizationId?: string }[];
  estimatedValue?: { currencyCode?: string; amount?: number };
  status?: string;
  deadline?: string;
  publicationDate?: string;
  type?: string;
  allTypes?: string[];
};


// Doffin matches literal text against notice titles and descriptions, so a
// whole sentence usually finds nothing while its key noun finds plenty.
// "feiemaskin" hits; "feiemaskin til kommunale veier og plasser" does not.
const STOPP = new Set([
  "til", "for", "og", "eller", "med", "uten", "som", "kan", "vil", "en", "et",
  "ei", "den", "det", "de", "i", "på", "av", "om", "fra", "hos", "ved", "er",
  "har", "vi", "jeg", "du", "meg", "oss", "finn", "kunder", "kunde", "bedrifter",
  "bedrift", "selge", "selger", "selg", "leverer", "leverandør", "nye", "ny",
  "små", "store", "mellomstore", "området", "rundt", "alle", "noen", "mange",
  // Procurement boilerplate. These appear in almost every notice, so falling
  // back to one of them matches the whole register: a search for "kjøre
  // oppdrag fra Oslo til Bergen" came back with accounting consultants and a
  // police evaluation, because "oppdrag" was the longest word left.
  "oppdrag", "anskaffelse", "anskaffelser", "kjøp", "innkjøp", "avtale",
  "rammeavtale", "konkurranse", "konkurransen", "tjeneste", "tjenester",
  "levering", "leveranse", "arbeid", "arbeider", "bistand", "prosjekt",
  "utstyr", "diverse", "annet", "øvrige", "vedlikehold", "drift",
]);

/** The distinctive words, longest first — the ones worth searching on. */
function noekkelord(tekst: string): string[] {
  return tekst
    .toLowerCase()
    .replace(/[^a-zæøå0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPP.has(w) && !/^\d+$/.test(w))
    .sort((a, b) => b.length - a.length)
    .slice(0, 3);
}

async function spor(searchString: string): Promise<DoffinHit[]> {
  const res = await fetch(
    "https://api.doffin.no/webclient/api/v2/search-api/search",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        searchString,
        numHitsPerPage: 40,
        page: 1,
        // Let Doffin do the filtering. Without this the API answers by
        // relevance across every notice ever published, and page one fills up
        // with competitions that closed years ago — "asfaltering" returned
        // 2 146 hits and not one of the 8 open ones was among the first 40.
        facets: { status: { checkedItems: ["ACTIVE"] } },
      }),
      next: { revalidate: 600 },
    }
  );
  if (!res.ok) return [];
  const json = (await res.json()) as { hits?: DoffinHit[] };
  return json.hits ?? [];
}

/**
 * Search Doffin for notices matching the seller's own words, keeping only
 * announcements that are still open (or planning notices, which have no
 * deadline but signal an upcoming purchase). Newest first, capped small.
 *
 * The full phrase is tried first; when it finds nothing, each key word is
 * tried on its own, because the seller writes a sentence and the buyer wrote
 * a product name.
 */
export async function sokAnbud(tekst: string, maks = 12): Promise<Anbud[]> {
  try {
    // Doffin matches on ANY word in the phrase, so a sentence never comes back
    // empty — "kjøre oppdrag fra oslo til bergen" returned twelve notices about
    // accounting, snow clearing and police work. Every hit therefore has to
    // earn its place by actually mentioning one of the words that carry the
    // meaning. Showing an unrelated tender is worse than showing none: the
    // seller spends an evening on a bid that was never theirs.
    const ord = noekkelord(tekst);
    const relevant = (h: DoffinHit) => {
      if (ord.length === 0) return true;
      const tekstIKunngjoering = `${h.heading ?? ""} ${h.description ?? ""}`.toLowerCase();
      return ord.some((o) => tekstIKunngjoering.includes(o));
    };

    let treff = (await spor(tekst)).filter(relevant);
    if (treff.length === 0) {
      for (const o of ord) {
        const kandidater = (await spor(o)).filter((h) =>
          `${h.heading ?? ""} ${h.description ?? ""}`.toLowerCase().includes(o)
        );
        if (kandidater.length > 0) {
          treff = kandidater;
          break;
        }
      }
    }
    const naa = Date.now();

    return treff
      .filter((h) => {
        if (!h.id || !h.heading) return false;
        // Doffin already filtered to ACTIVE; these are belt and braces, and
        // catch a deadline that passed since the notice was last indexed.
        if (h.status === "EXPIRED" || h.status === "CANCELLED") return false;
        if (h.deadline && new Date(h.deadline).getTime() <= naa) return false;
        return true;
      })
      // Soonest deadline first — a competition closing this week is worth more
      // than one that just opened. Notices without a deadline (dynamic
      // purchasing schemes you can join any time) go last.
      .sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"))
      .slice(0, maks)
      .map((h) => ({
        id: h.id!,
        tittel: (h.heading ?? "").slice(0, 160),
        beskrivelse: (h.description ?? "").slice(0, 260),
        kjoperNavn: h.buyer?.[0]?.name ?? "Ukjent oppdragsgiver",
        kjoperOrgnr: h.buyer?.[0]?.organizationId?.replace(/\s/g, "") ?? null,
        verdi:
          h.estimatedValue?.currencyCode === "NOK" && h.estimatedValue.amount
            ? h.estimatedValue.amount
            : null,
        frist: h.deadline ?? null,
        publisert: h.publicationDate ?? null,
        lenke: `https://www.doffin.no/notices/${encodeURIComponent(h.id!)}`,
      }));
  } catch {
    // Doffin being down must never break the company search next to it.
    return [];
  }
}
