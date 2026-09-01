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
      body: JSON.stringify({ searchString, numHitsPerPage: 40, page: 1 }),
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
    let treff = await spor(tekst);
    if (treff.length === 0) {
      for (const ord of noekkelord(tekst)) {
        treff = await spor(ord);
        if (treff.length > 0) break;
      }
    }
    const naa = Date.now();

    return treff
      .filter((h) => {
        if (!h.id || !h.heading) return false;
        if (h.status === "EXPIRED" || h.status === "CANCELLED") return false;
        // A deadline in the past means the competition is over even when the
        // status field lags behind.
        if (h.deadline && new Date(h.deadline).getTime() < naa) return false;
        return true;
      })
      .sort((a, b) => (b.publicationDate ?? "").localeCompare(a.publicationDate ?? ""))
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
