import KOMMUNEDATA from "@/data/kommuner.json";
import { modell } from "@/lib/lead-query";
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

/**
 * Action words: what you *do*, not what you sell.
 *
 * Notices are categorised by noun — "Asfaltering", "Vikartjenester",
 * "Kontormøbler" — so a verb can never carry a search on its own. A length
 * rule was tried first and was quietly biased: it would have thrown out
 * kaffe, frukt, glass and strøm, which are exactly the words a seller in
 * those trades would use. Grammar is fair to every industry; word length is
 * not.
 */
const HANDLINGSORD = new Set([
  "legge", "kjøre", "frakte", "hente", "bringe", "rydde", "vaske", "montere",
  "installere", "reparere", "bygge", "grave", "felle", "skifte", "bytte",
  "ordne", "fikse", "utføre", "gjøre", "lage", "sette", "drive", "holde",
  "pusse", "koste", "rive", "flytte", "losse", "laste", "måke", "levere",
]);

/**
 * Place names, from the same municipality list the lead search uses.
 *
 * Geography is a filter, not a subject: "oslo" and "bergen" appear in the
 * description of a large share of all notices, so treating them as meaningful
 * made "kjøre oppdrag fra Oslo til Bergen" match sensor calibration and
 * ventilation contracts. What the seller *delivers* is the topic.
 */
const STEDER = new Set<string>(
  (KOMMUNEDATA as { fylke: Record<string, string>; kommuner: { n: string }[] }).kommuner
    .flatMap((k) => k.n.toLowerCase().split(/[\s\-/]+/))
    .concat(
      Object.values(
        (KOMMUNEDATA as { fylke: Record<string, string> }).fylke
      ).flatMap((f) => f.toLowerCase().split(/[\s\-/]+/))
    )
    .filter((w) => w.length >= 3)
);

/** The distinctive words, longest first — the ones worth searching on. */
function noekkelord(tekst: string): string[] {
  return tekst
    .toLowerCase()
    .replace(/[^a-zæøå0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(
      (w) => w.length >= 4 && !STOPP.has(w) && !STEDER.has(w) && !/^\d+$/.test(w)
    )
    .sort((a, b) => b.length - a.length)
    .slice(0, 3);
}

/**
 * Does the notice actually talk about this word?
 *
 * The match has to start a word. Plain substring matching let "legge" hit
 * "planlegge" and "kjøre" hit "kjøretøy", which is how a search for decking
 * came back with a data centre. Norwegian compounds put the meaningful stem
 * first, so a prefix match is right and a suffix match is not.
 */
function naevner(h: DoffinHit, ord: string, kunTittel = false): boolean {
  const tekst = (
    kunTittel ? (h.heading ?? "") : `${h.heading ?? ""} ${h.description ?? ""}`
  ).toLowerCase();
  let i = tekst.indexOf(ord);
  while (i >= 0) {
    if (i === 0 || !/[a-zæøå0-9]/.test(tekst[i - 1])) return true;
    i = tekst.indexOf(ord, i + 1);
  }
  return false;
}

/**
 * Translate the seller's own words into the words a notice would use.
 *
 * This is the gap no amount of word filtering can close: a contractor writes
 * "måke snø" and the municipality wrote "Vintervedlikehold"; someone writes
 * "feing av gater" and the notice says "Gatefeiing". Same trade, different
 * vocabulary. Only a model that knows Norwegian bridges that, and it does so
 * for every industry rather than the ones we happened to test.
 *
 * Runs only when the plain search came back empty, so the common case stays
 * instant and free, and the model is asked roughly once per fruitless search.
 */
async function aiSokeord(tekst: string): Promise<string[]> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return [];

  const verktoy = {
    name: "foreslaa_sokeord",
    description: "Foreslå ordene en norsk offentlig kunngjøring ville brukt.",
    input_schema: {
      type: "object" as const,
      properties: {
        sokeord: {
          type: "array",
          items: { type: "string" },
          description:
            "2–4 enkeltord eller korte uttrykk, slik de ville stått i tittelen " +
            "på en kunngjøring på Doffin. Mest sannsynlige først.",
        },
      },
      required: ["sokeord"],
    },
  };

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: modell(),
        max_tokens: 300,
        system:
          "Du oversetter dagligtale til fagspråket i norske offentlige " +
          "anskaffelser. Brukeren skriver hva de leverer med egne ord; du " +
          "svarer med ordene en kunngjøring på Doffin ville brukt i tittelen. " +
          "Bruk substantiv, ikke verb: kunngjøringer heter «Snøbrøyting», " +
          "ikke «måke snø». Eksempler fra ulike bransjer: «måke snø» → " +
          "snøbrøyting, vintervedlikehold. «feing av gater» → gatefeiing, " +
          "renhold av veier. «lage mat til møter» → catering, kantinedrift. " +
          "«fikse pc-er» → IT-drift, brukerstøtte. «kjøre varer for andre» → " +
          "transporttjenester, godstransport. «vaske klær» → tekstilvask, " +
          "vaskeritjenester. Ikke finn på fagområder brukeren ikke nevnte.",
        tools: [verktoy],
        tool_choice: { type: "tool", name: "foreslaa_sokeord" },
        messages: [{ role: "user", content: `Brukeren leverer: "${tekst}"` }],
      }),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const bruk = (json?.content ?? []).find((c: { type?: string }) => c?.type === "tool_use");
    return ((bruk?.input?.sokeord ?? []) as unknown[])
      .map((o) => String(o).toLowerCase().trim())
      .filter((o) => o.length >= 4 && o.length <= 40)
      .slice(0, 4);
  } catch {
    return [];
  }
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
      return ord.some((o) => naevner(h, o));
    };

    let treff = (await spor(tekst)).filter(relevant);
    if (treff.length === 0) {
      // A fallback word carries the whole result set on its own, so it has to
      // earn that twice over: it must name a thing rather than an action, and
      // it must appear in the notice's own title. A word buried in a
      // description is a mention; a word in the title is what the notice is
      // about.
      for (const o of ord.filter((x) => !HANDLINGSORD.has(x))) {
        const kandidater = (await spor(o)).filter((h) => naevner(h, o, true));
        if (kandidater.length > 0) {
          treff = kandidater;
          break;
        }
      }
    }

    // Last resort: let the model say what a notice would have called this.
    // The seller's word and the buyer's word are often different words for
    // the same trade, and nothing mechanical closes that gap.
    if (treff.length === 0) {
      const sett = new Map<string, DoffinHit>();
      for (const forslag of await aiSokeord(tekst)) {
        // A suggestion can be two words ("renhold av veier"); require the
        // first, most specific one to appear in the title.
        const kjerne = forslag.split(/\s+/)[0];
        for (const h of await spor(forslag)) {
          if (h.id && !sett.has(h.id) && naevner(h, kjerne, true)) sett.set(h.id, h);
        }
      }
      treff = [...sett.values()];
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
