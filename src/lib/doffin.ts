import KOMMUNEDATA from "@/data/kommuner.json";
import CPVDATA from "@/data/cpv.json";
import { modell } from "@/lib/lead-query";

const CPV = (CPVDATA as { koder: { k: string; n: string }[] }).koder;
// Active public tenders from Doffin — the buyers who are looking right now.
//
// The industry-code search finds companies that exist; Doffin shows demand:
// a municipality announcing a competition for road sweepers is a buyer with a
// budget and a deadline. The endpoint is the same open, unauthenticated one
// Doffin's own website uses, the data is public procurement notices published
// to be read, and every query here is user-triggered and cached — we are a
// polite guest, not a crawler.

/**
 * Doffin's regions. A plumber in Trondheim has no use for a competition in
 * Finnmark, and "Ikke stedbunden" covers framework agreements with no
 * geography — those are relevant everywhere, so they always come along.
 */
export const REGIONER: { id: string; navn: string }[] = [
  { id: "NO08", navn: "Oslo og Viken" },
  { id: "NO09", navn: "Agder og Sør-Østlandet" },
  { id: "NO02", navn: "Innlandet" },
  { id: "NO0A", navn: "Vestlandet" },
  { id: "NO06", navn: "Trøndelag" },
  { id: "NO07", navn: "Nord-Norge" },
];

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
  /**
   * A dynamic purchasing scheme. Roughly a third of everything open on Doffin
   * is one of these, and they are the realistic way in for a small supplier:
   * you qualify once, then get invited to mini-competitions for years. The
   * stated value is the ceiling for the whole scheme over its lifetime, not
   * the size of a job — the individual awards are often a few hundred
   * thousand. Shown differently for that reason.
   */
  lopende: boolean;
  /**
   * The notice also went to TED, which means it is above the EEA threshold.
   * A size signal for the half of all notices that state no value at all.
   */
  overTerskel: boolean;
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
  sentToTed?: boolean;
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

/**
 * Which CPV categories does this seller belong in?
 *
 * CPV is the EU procurement vocabulary, and every notice is tagged with codes
 * by the buyer. Matching on codes sidesteps wording entirely: "måke snø",
 * "snøbrøyting" and "vintervedlikehold" are all 90600000, so the seller's own
 * phrasing stops mattering. The model picks only from the real list, and each
 * answer is checked against it — it cannot invent a category.
 */
async function aiKoder(tekst: string): Promise<string[]> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return [];

  const liste = CPV.map((c) => `${c.k} ${c.n}`).join(String.fromCharCode(10));
  const verktoy = {
    name: "velg_cpv",
    description: "Velg CPV-kategoriene som passer det brukeren leverer.",
    input_schema: {
      type: "object" as const,
      properties: {
        koder: {
          type: "array",
          items: { type: "string" },
          description:
            "1–3 CPV-koder fra listen, den mest treffende først. Velg bare " +
            "kategorier du er trygg på — heller én presis enn tre omtrentlige.",
        },
      },
      required: ["koder"],
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
          "Du plasserer en norsk leverandør i riktig CPV-kategori — EUs " +
          "vokabular for offentlige anskaffelser. Brukeren skriver med egne " +
          "ord hva de leverer; du velger kategorien en kunngjøring om nettopp " +
          "dette ville vært merket med. Velg kun fra listen, og vær presis: " +
          "en for vid kategori fyller svaret med kunngjøringer fra helt andre " +
          "fag. «Legge platting» hører til ferdigstillende bygningsarbeid, " +
          "ikke til bygg og anlegg generelt. Passer ingen kategori godt, " +
          "svar med tom liste framfor å gjette.",
        tools: [verktoy],
        tool_choice: { type: "tool", name: "velg_cpv" },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `CPV-KATEGORIER:${String.fromCharCode(10)}${liste}`,
                cache_control: { type: "ephemeral" },
              },
              { type: "text", text: `Brukeren leverer: "${tekst}"` },
            ],
          },
        ],
      }),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const bruk = (json?.content ?? []).find((c: { type?: string }) => c?.type === "tool_use");
    const gyldige = new Set(CPV.map((c) => c.k));
    return ((bruk?.input?.koder ?? []) as unknown[])
      .map((k) => String(k).trim())
      .filter((k) => gyldige.has(k))
      .slice(0, 4);
  } catch {
    return [];
  }
}

/** All open notices tagged with these CPV categories. */
async function sporKoder(koder: string[], region?: string): Promise<DoffinHit[]> {
  if (koder.length === 0) return [];
  try {
    const res = await fetch(
      "https://api.doffin.no/webclient/api/v2/search-api/search",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          searchString: "",
          numHitsPerPage: 40,
          page: 1,
          facets: {
            status: { checkedItems: ["ACTIVE"] },
            cpvCodesId: { checkedItems: koder },
            ...(region ? { location: { checkedItems: [region, "anyw"] } } : {}),
          },
        }),
        next: { revalidate: 600 },
      }
    );
    if (!res.ok) return [];
    // Capped: a wide category can hold hundreds of notices, and letting one
    // flood the list buries the hits found on the seller's own words.
    return (((await res.json()) as { hits?: DoffinHit[] }).hits ?? []).slice(0, 20);
  } catch {
    return [];
  }
}

async function spor(searchString: string, region?: string): Promise<DoffinHit[]> {
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
        facets: {
          status: { checkedItems: ["ACTIVE"] },
          // "anyw" = notices with no geography: framework agreements that
          // apply anywhere, and always worth seeing alongside a region.
          ...(region ? { location: { checkedItems: [region, "anyw"] } } : {}),
        },
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
export async function sokAnbud(tekst: string, maks = 12, region?: string): Promise<Anbud[]> {
  try {
    // Doffin matches on ANY word in the phrase, so a sentence never comes back
    // empty — "kjøre oppdrag fra oslo til bergen" returned twelve notices about
    // accounting, snow clearing and police work. Every hit therefore has to
    // earn its place by actually mentioning one of the words that carry the
    // meaning. Showing an unrelated tender is worse than showing none: the
    // seller spends an evening on a bid that was never theirs.
    // How each hit was found: 0 = the seller's own words, 1 = the model's
    // wording, 2 = category alone. Decides the order at the end.
    const kilderang = new Map<string, number>();
    const ord = noekkelord(tekst);
    const relevant = (h: DoffinHit) => {
      if (ord.length === 0) return true;
      return ord.some((o) => naevner(h, o));
    };

    let treff = (await spor(tekst, region)).filter(relevant);
    if (treff.length === 0) {
      // A fallback word carries the whole result set on its own, so it has to
      // earn that twice over: it must name a thing rather than an action, and
      // it must appear in the notice's own title. A word buried in a
      // description is a mention; a word in the title is what the notice is
      // about.
      for (const o of ord.filter((x) => !HANDLINGSORD.has(x))) {
        const kandidater = (await spor(o, region)).filter((h) => naevner(h, o, true));
        if (kandidater.length > 0) {
          treff = kandidater;
          break;
        }
      }
    }

    // Let the model say what a notice would have called this. The seller's
    // word and the buyer's word are often different words for the same trade,
    // and nothing mechanical closes that gap.
    //
    // The threshold is not zero on purpose: a single weak mechanical match
    // used to block this entirely. "Lage mat til møter" found a notice for
    // meeting-room *furniture*, called it a day, and never asked about
    // catering. Below a handful of hits the model is worth the second.
    if (treff.length < 3) {
      // Ask for categories and wording at once: the codes find everything in
      // the trade regardless of phrasing, the words catch a notice filed under
      // an odd category. Both run in parallel — neither waits for the other.
      const [koder, forslag] = await Promise.all([aiKoder(tekst), aiSokeord(tekst)]);
      const fraKoder = await sporKoder(koder, region);
      // In parallel: four suggestions run one after another added seconds to a
      // search that had already come up empty twice.
      const svar = await Promise.all(
        forslag.map(async (f) => {
          // A suggestion can be two words ("renhold av veier"); require the
          // first, most specific one to appear in the title.
          const kjerne = f.split(/\s+/)[0];
          return (await spor(f, region)).filter((h) => naevner(h, kjerne, true));
        })
      );
      // Merged, not replaced: the mechanical hits were found on the seller's
      // own words, which is the strongest signal there is. The model's are
      // added behind them.
      // Order by how the hit was found, not just by deadline. A notice that
      // matched the seller's own words is a surer thing than one that merely
      // shares a category: "vakthold" finds two notices actually about
      // guarding, and those must not end up below a radar procurement that
      // happens to sit in the same CPV branch.
      const sett = new Map<string, DoffinHit>();
      const rangert: [DoffinHit, number][] = [
        ...treff.map((h) => [h, 0] as [DoffinHit, number]),
        ...svar.flat().map((h) => [h, 1] as [DoffinHit, number]),
        ...fraKoder.map((h) => [h, 2] as [DoffinHit, number]),
      ];
      for (const [h, rang] of rangert) {
        if (h.id && !sett.has(h.id)) {
          sett.set(h.id, h);
          kilderang.set(h.id, rang);
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
      // Surest match first, then soonest deadline within each group. A
      // competition closing this week beats one that just opened, but a hit
      // on the seller's own words beats a mere category match either way.
      // Notices with no deadline (open schemes) go last in their group.
      .sort((a, b) => {
        const ra = kilderang.get(a.id ?? "") ?? 0;
        const rb = kilderang.get(b.id ?? "") ?? 0;
        if (ra !== rb) return ra - rb;
        return (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999");
      })
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
        lopende:
          h.allTypes?.includes("DYNAMIC_PURCHASING_SCHEME") ||
          h.type === "DYNAMIC_PURCHASING_SCHEME" ||
          false,
        overTerskel: h.sentToTed === true,
      }));
  } catch {
    // Doffin being down must never break the company search next to it.
    return [];
  }
}

/** What Doffin ended up saying about a competition we followed. */
export type Utfall = {
  /** True once a contract-award notice exists for the procurement. */
  avgjort: boolean;
  /** The suppliers that won. Empty until the award notice is published. */
  vinnere: string[];
  /** How many bids the buyer received, when stated. */
  antallTilbud: number | null;
  /** The award notice itself, so the user can read it. */
  lenke: string | null;
};

/**
 * Ask Doffin how a competition ended.
 *
 * A procurement is several notices: the competition, then — if the buyer
 * publishes one — the award. They are linked through procurementTimeline, so
 * we read the competition, look for a RESULT entry, and fetch that.
 *
 * Only about one in four competitions ever gets an award notice, so "not
 * decided" is the normal answer and must never be shown as "you lost".
 */
export async function hentUtfall(doffinId: string): Promise<Utfall | null> {
  const hent = async (id: string) => {
    const res = await fetch(
      `https://api.doffin.no/webclient/api/v2/notices-api/notices/${encodeURIComponent(id)}`,
      // Six hours. The median wait from deadline to award is about three
      // months, so there is nothing to gain from asking more often.
      { next: { revalidate: 21_600 } }
    );
    return res.ok ? await res.json() : null;
  };

  try {
    const notis = await hent(doffinId);
    if (!notis) return null;

    const tidslinje = (notis.procurementTimeline ?? []) as {
      id?: string;
      allType?: string[];
    }[];
    const resultat = tidslinje.find((e) => e.allType?.includes("RESULT"));
    if (!resultat?.id)
      return { avgjort: false, vinnere: [], antallTilbud: null, lenke: null };

    const tildeling =
      resultat.id === doffinId ? notis : await hent(resultat.id);
    if (!tildeling)
      return { avgjort: false, vinnere: [], antallTilbud: null, lenke: null };

    const antall = (tildeling.allReceivedTenders ?? []).find(
      (t: { type?: string }) => t?.type === "tenders"
    )?.total;

    return {
      avgjort: true,
      vinnere: ((tildeling.awardedNames ?? []) as unknown[])
        .map((n) => String(n).trim())
        .filter(Boolean),
      antallTilbud: typeof antall === "number" && antall > 0 ? antall : null,
      lenke: `https://www.doffin.no/notices/${encodeURIComponent(resultat.id)}`,
    };
  } catch {
    // No outcome is a fine answer; a broken page is not.
    return null;
  }
}
