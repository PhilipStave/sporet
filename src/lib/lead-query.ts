import NAERINGSKODER from "@/data/naeringskoder.json";
import KOMMUNEDATA from "@/data/kommuner.json";
import type { LeadFilter } from "./brreg";

// Turns "jeg selger betongelementer til boligprosjekt i Bergen" into a register query.
//
// Two implementations behind one function:
//   1. matchLocally  — plain code, costs nothing, always available.
//   2. an AI pass    — only when ANTHROPIC_API_KEY is set (see interpret()).
// The local matcher is not a stopgap: it is also the fallback if the API is down.

type Kode = { k: string; n: string; s: string };
const KODER = NAERINGSKODER as Kode[];

// All 358 municipalities with their county, so the model can resolve "Bergens-
// området" or "Vestland" itself instead of relying on a hand-written shortlist.
const KOMMUNER = (KOMMUNEDATA as { kommuner: { k: string; n: string; f: string }[] }).kommuner;
const FYLKE = (KOMMUNEDATA as { fylke: Record<string, string> }).fylke;

export type Interpretation = {
  filter: LeadFilter;
  /** Human-readable account of what we searched for, shown above the results. */
  forklaring: string;
  /** Which path produced this — surfaced in the UI so it is never a mystery. */
  kilde: "lokal" | "ai";
  /** How many results the user asked for, when they said a number. */
  antall?: number;
};

// Municipality numbers for the places people actually type. Not exhaustive by
// design — an unrecognised place simply means "search all of Norway".
const STEDER: { navn: string; numre: string[] }[] = [
  { navn: "Oslo", numre: ["0301"] },
  { navn: "Bergen", numre: ["4601"] },
  { navn: "Trondheim", numre: ["5001"] },
  { navn: "Stavanger", numre: ["1103"] },
  { navn: "Sandnes", numre: ["1108"] },
  { navn: "Kristiansand", numre: ["4204"] },
  { navn: "Drammen", numre: ["3301"] },
  { navn: "Tromsø", numre: ["5501"] },
  { navn: "Bodø", numre: ["1804"] },
  { navn: "Ålesund", numre: ["1508"] },
  { navn: "Fredrikstad", numre: ["3107"] },
  { navn: "Sarpsborg", numre: ["3105"] },
  { navn: "Skien", numre: ["4003"] },
  { navn: "Porsgrunn", numre: ["4001"] },
  { navn: "Haugesund", numre: ["1106"] },
  { navn: "Molde", numre: ["1506"] },
  { navn: "Lillehammer", numre: ["3405"] },
  { navn: "Hamar", numre: ["3403"] },
  { navn: "Gjøvik", numre: ["3407"] },
  { navn: "Tønsberg", numre: ["3905"] },
  { navn: "Larvik", numre: ["3909"] },
  { navn: "Moss", numre: ["3103"] },
  { navn: "Arendal", numre: ["4203"] },
  { navn: "Bærum", numre: ["3201"] },
  { navn: "Asker", numre: ["3203"] },
  { navn: "Lillestrøm", numre: ["3205"] },
];

const STOPPORD = new Set([
  "jeg", "vi", "selger", "til", "og", "eller", "som", "med", "for", "en", "et",
  "de", "det", "den", "i", "på", "av", "er", "har", "kan", "vil", "helst",
  "gjerne", "bedrifter", "bedrift", "firmaer", "firma", "kunder", "kunde",
  "selskaper", "selskap", "ansatte", "mest", "leter", "etter", "trenger",
  "min", "mitt", "våre", "vår", "meg", "oss", "seg", "over", "under", "mellom",
  // Customer types, not industries. Left to KJOPERE below, which maps them to
  // the right code — scoring them as words hits "kommunikasjonsutstyr".
  "kommune", "kommuner", "kommunen", "kommunene", "fylke", "fylker",
]);

function normaliser(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\wæøå\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ord(s: string) {
  return normaliser(s)
    .split(" ")
    .filter((w) => w.length > 2 && !STOPPORD.has(w));
}

/** Crude stem so "betongelementer" still matches "betongprodukter". */
function stamme(w: string) {
  return w.replace(/(ene|ane|er|en|et|a|e)$/, "");
}


/**
 * What you sell -> who buys it. The register is organised by what a company
 * DOES, so a word-match on the product finds competitors, not customers. This
 * table closes that gap for the equipment and trade categories Norwegian SMBs
 * actually sell. Curated, not generated — every code is checked to exist.
 */
const KJOPERE: { ord: string[]; koder: string[]; hva: string; former?: string[] }[] = [
  {
    ord: ["feiemaskin", "feiing", "gatefeiing", "sopemaskin", "spylebil", "kostebil",
          // Sweeper brands — a model name alone should be enough to search.
          "bucher", "schmidt", "ravo", "dulevo", "johnston", "boschung"],
    koder: ["84.110", "42.110", "81.230"],
    hva: "kommuner, veientreprenører og renholdsfirma",
    former: ["AS", "KOMM", "FYLK"],
  },
  {
    ord: ["gravemaskin", "hjullaster", "anleggsmaskin", "dumper", "beltemaskin",
          "minigraver", "entreprenørmaskin", "gravelaster",
          // Machine brands.
          "caterpillar", "komatsu", "hitachi", "doosan", "hyundai", "kubota",
          "bobcat", "wacker neuson", "takeuchi", "liebherr", "sennebogen"],
    koder: ["43.120", "42.110", "41.000"],
    hva: "grunnentreprenører, veibyggere og byggefirma",
  },
  {
    ord: ["komprimering", "vibrasjonsplate", "vibroplate", "jordpakker", "valse",
          "stampemaskin", "komprimator", "hoppetusse",
          "swepac", "dynapac", "wacker", "bomag", "ammann", "weber mt"],
    koder: ["43.120", "42.110", "41.000"],
    hva: "grunnentreprenører, veibyggere og byggefirma",
  },
  {
    ord: ["snøbrøyting", "brøyteutstyr", "snøfreser", "strøapparat", "snømåking",
          "brøyteskjær", "wille", "holder", "multihog"],
    koder: ["84.110", "42.110", "81.230"],
    hva: "kommuner, veientreprenører og driftsselskap",
    former: ["AS", "KOMM", "FYLK"],
  },
  {
    ord: ["lastebil", "tippbil", "kranbil", "semitrailer", "henger"],
    koder: ["49.410", "43.120", "42.110"],
    hva: "transportfirma og entreprenører",
  },
  {
    ord: ["traktor", "landbruksmaskin", "skurtresker", "gjødselspreder",
          "john deere", "massey ferguson", "claas", "fendt", "valtra"],
    koder: ["01.110", "01.500", "02.200"],
    hva: "gårdsbruk og skogbruk",
  },
  {
    ord: ["truck", "gaffeltruck", "lagerreol", "lagertruck", "pallereol",
          "linde", "jungheinrich", "toyota truck", "still"],
    koder: ["52.100", "46.900", "10.890"],
    hva: "lager, grossister og industri",
  },
  {
    ord: ["kranutstyr", "lift", "personløfter", "stillas", "byggeheis",
          "teleskoplaster", "manitou", "merlo", "avant", "genie", "haulotte"],
    koder: ["43.120", "41.000", "43.910"],
    hva: "entreprenører og byggefirma",
  },
  {
    ord: ["vannrenseanlegg", "pumpe", "kloakkutstyr", "septik"],
    koder: ["42.210", "36.000", "37.000"],
    hva: "VA-entreprenører og vannverk",
  },
  {
    ord: ["kontormøbler", "kontorstol", "møterom"],
    koder: ["69.201", "69.100", "70.200"],
    hva: "kontorbedrifter, regnskap, advokat og rådgivning",
  },
  {
    ord: ["betongelement", "ferdigbetong", "armering", "forskaling"],
    koder: ["41.000", "43.120", "42.110"],
    hva: "byggefirma og grunnentreprenører",
  },
  // Generic customer types. Last, so a specific product above wins first.
  {
    ord: ["kommune", "fylke", "offentlig sektor", "det offentlige"],
    koder: ["84.110", "84.120", "84.130"],
    hva: "kommuner og offentlig forvaltning",
    former: ["KOMM", "FYLK"],
  },
];

/**
 * Which legal forms to search. AS by default; public-administration codes (84.x)
 * need KOMM/FYLK, because a municipality is not a limited company and would
 * otherwise return nothing.
 */
function formerFor(koder: string[], eksplisitt?: string[]) {
  if (eksplisitt?.length) return eksplisitt;
  const offentlig = koder.some((k) => k.startsWith("84."));
  return offentlig ? ["AS", "KOMM", "FYLK"] : ["AS"];
}

/** Human-readable name for those forms, used in the explanation line. */
function formNavn(former: string[]) {
  const harOffentlig = former.some((f) => f === "KOMM" || f === "FYLK");
  if (harOffentlig && former.includes("AS")) return "aksjeselskap og kommuner";
  if (harOffentlig) return "kommuner og fylker";
  return "aksjeselskap";
}


/**
 * Naming the customer directly — "IT-tjenester til advokater", "entreprenører
 * med over 20 ansatte". KJOPERE maps a product to its buyers; this maps a
 * buyer type straight to its codes, for when the user already knows who they
 * are after. Checked after KJOPERE, so a product word still wins.
 */
const KUNDETYPER: { ord: string[]; koder: string[]; hva: string; former?: string[] }[] = [
  { ord: ["entreprenør", "entreprenor", "grunnarbeid", "anleggsfirma", "anleggsbransjen"],
    koder: ["43.120", "42.110", "41.000"], hva: "entreprenører og byggefirma" },
  { ord: ["byggefirma", "byggmester", "tømrer", "snekker", "byggebransjen"],
    koder: ["41.000", "43.910", "43.320"], hva: "byggefirma og tømrere" },
  { ord: ["advokat", "jurist", "advokatfirma"],
    koder: ["69.100"], hva: "advokater og juridiske tjenester" },
  { ord: ["regnskapsfører", "regnskapsbyrå", "revisor", "regnskapskontor"],
    koder: ["69.202", "69.201"], hva: "regnskapsførere og revisorer" },
  { ord: ["rørlegger", "elektriker", "vvs", "elektrofirma", "håndverker"],
    koder: ["43.221", "43.210", "43.223"], hva: "rørleggere og elektrikere" },
  { ord: ["transportfirma", "transportør", "lastebileier", "speditør"],
    koder: ["49.410", "52.211"], hva: "transportfirma" },
  { ord: ["hotell", "overnatting", "campingplass"],
    koder: ["55.100", "55.900", "55.300"], hva: "hoteller og overnattingssteder" },
  { ord: ["restaurant", "kafé", "kafe", "serveringssted", "spisested"],
    koder: ["56.110", "56.210", "56.220"], hva: "restauranter og serveringssteder" },
  { ord: ["gårdsbruk", "bonde", "bønder", "landbruket", "skogbruk"],
    koder: ["01.110", "01.500", "02.200"], hva: "gårdsbruk og skogbruk" },
  { ord: ["tannlege", "legekontor", "lege", "helsetjeneste", "fysioterapi"],
    koder: ["86.230", "86.210", "86.221"], hva: "leger og tannleger" },
  { ord: ["barnehage", "skole", "grunnskole", "undervisning"],
    koder: ["85.100", "85.201", "85.310"], hva: "barnehager og skoler" },
  { ord: ["eiendomsselskap", "gårdeier", "utleier", "eiendomsforvalt", "borettslag"],
    koder: ["68.200", "68.320", "68.110"], hva: "eiendomsselskaper og forvaltere" },
  { ord: ["renhold", "renholdsbyrå", "vaskehjelp", "renholdstjeneste"],
    koder: ["68.200", "69.202", "70.200"], hva: "eiendomsselskaper og kontorbedrifter" },
  { ord: ["rådgiv", "konsulent", "arkitekt", "ingeniør"],
    koder: ["70.200", "71.110", "71.129"], hva: "rådgivere og ingeniører" },
  { ord: ["frisør", "skjønnhetssalong", "salong"],
    koder: ["96.210", "96.220"], hva: "frisører og skjønnhetspleie" },
  // Public sector as a named customer. Must live here too, not only in
  // KJOPERE — otherwise "gravemaskiner til kommuner" lets the product word win
  // and returns contractors, which is the opposite of what was asked for.
  { ord: ["kommune", "fylke", "offentlig sektor", "det offentlige", "offentlige etater"],
    koder: ["84.110", "84.120", "84.130"], hva: "kommuner og offentlig forvaltning",
    former: ["KOMM", "FYLK"] },
];

/** Direct hit on a named customer type. */
function matchKundetype(tekst: string) {
  const lav = normaliser(tekst);
  for (const rad of KUNDETYPER) {
    for (const o of rad.ord) if (lav.includes(o)) return rad;
  }
  return null;
}

/** Direct hit on the buyer table, before any word scoring. */
function matchKjopere(tekst: string) {
  const lav = normaliser(tekst);
  for (const rad of KJOPERE) {
    for (const o of rad.ord) {
      // Substring, so "feiemaskiner" and "feiemaskinen" both land.
      if (lav.includes(o)) return rad;
    }
  }
  return null;
}

/** Longest shared prefix of two words. */
function fellesPrefiks(a: string, b: string) {
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n && a[i] === b[i]) i++;
  return i;
}

/**
 * Five shared letters is enough for Norwegian compounds ("betongelement" ~
 * "betongprodukter", "regnskapstjenester" ~ "regnskapsføring"). Words that
 * collide at exactly this length — "kommune" against "kommunikasjon" — are
 * handled by keeping them out of the scoring path entirely.
 */
function godtPrefiks(a: string, b: string) {
  return fellesPrefiks(a, b) >= 5;
}

function finnSteder(tekst: string) {
  const lav = normaliser(tekst);
  const treff = STEDER.filter((s) => lav.includes(normaliser(s.navn)));
  return {
    numre: treff.flatMap((s) => s.numre),
    navn: treff.map((s) => s.navn),
  };
}

/** Place names must not also be read as industries — "Bergen" is not mining. */
function utenSteder(tekst: string) {
  let ut = normaliser(tekst);
  for (const s of STEDER) ut = ut.split(normaliser(s.navn)).join(" ");
  return ut;
}

function finnAnsatte(tekst: string) {
  // "10-50 ansatte", "over 20 ansatte", "minst 5"
  const spenn = tekst.match(/(\d+)\s*(?:-|–|til)\s*(\d+)\s*ansatte/i);
  if (spenn) return { fra: Number(spenn[1]), til: Number(spenn[2]) };

  const over = tekst.match(/(?:over|minst|mer enn|fra)\s*(\d+)\s*ansatte/i);
  if (over) return { fra: Number(over[1]), til: undefined };

  const under = tekst.match(/(?:under|maks|mindre enn|opp til)\s*(\d+)\s*ansatte/i);
  if (under) return { fra: undefined, til: Number(under[1]) };

  return { fra: undefined, til: undefined };
}

/**
 * Scores industry codes against the query, word by word. Matching is on whole
 * words or a shared prefix of at least five letters, which is what keeps
 * Norwegian compounds working ("betongelementer" ~ "betongprodukter") without
 * letting short fragments collide ("Bergen" must not hit "bergverksdrift").
 */
function matchKoder(tekst: string, antall = 3) {
  const ordene = ord(utenSteder(tekst));
  if (ordene.length === 0) return [];
  const stammer = ordene.map(stamme);

  const skaarer = KODER.map((k) => {
    const navnOrd = normaliser(k.n).split(" ").filter((w) => w.length > 2);
    const beskrivelseOrd = normaliser(k.s).split(" ").filter((w) => w.length > 2);
    let skaar = 0;

    for (let i = 0; i < ordene.length; i++) {
      const w = ordene[i];
      const st = stammer[i];
      let beste = 0;

      for (const nw of navnOrd) {
        if (nw === w) { beste = Math.max(beste, 10); continue; }
        if (godtPrefiks(nw, st)) beste = Math.max(beste, 6);
      }
      for (const bw of beskrivelseOrd) {
        if (bw === w) { beste = Math.max(beste, 2); continue; }
        if (godtPrefiks(bw, st)) beste = Math.max(beste, 1);
      }
      skaar += beste;
    }
    return { kode: k, skaar };
  })
    .filter((r) => r.skaar >= 6)
    .sort((a, b) => b.skaar - a.skaar);

  return skaarer.slice(0, antall).map((r) => r.kode);
}

/** The free path. Always works, costs nothing. */
export function matchLocally(tekst: string): Interpretation | null {
  const sted = finnSteder(tekst);
  const ansatte = finnAnsatte(tekst);

  // Naming the customer wins over the product's default buyers: "gravemaskiner
  // til kommuner" means kommuner, even though excavators normally go to
  // contractors. Only when no customer is named do we fall back to who usually
  // buys the product.
  const kjoper = matchKundetype(tekst) ?? matchKjopere(tekst);
  const koder = kjoper
    ? kjoper.koder.map((k) => KODER.find((x) => x.k === k)).filter(Boolean as unknown as (v: Kode | undefined) => v is Kode)
    : matchKoder(tekst);
  if (koder.length === 0) return null;

  const former = formerFor(koder.map((k) => k.k), kjoper?.former);

  const deler = [
    kjoper
      ? `kjøpere: ${kjoper.hva}`
      : `bransje: ${koder.map((k) => k.n.toLowerCase()).join(", ")}`,
  ];
  if (sted.navn.length) deler.push(`sted: ${sted.navn.join(", ")}`);
  if (ansatte.fra != null && ansatte.til != null) deler.push(`${ansatte.fra}–${ansatte.til} ansatte`);
  else if (ansatte.fra != null) deler.push(`minst ${ansatte.fra} ansatte`);
  else if (ansatte.til != null) deler.push(`opp til ${ansatte.til} ansatte`);
  deler.push(formNavn(former));

  return {
    filter: {
      naeringskoder: koder.map((k) => k.k),
      kommunenummer: sted.numre.length ? sted.numre : undefined,
      fraAntallAnsatte: ansatte.fra,
      tilAntallAnsatte: ansatte.til,
      organisasjonsformer: former,
    },
    forklaring: deler.join(" · "),
    kilde: "lokal",
  };
}


/**
 * Rules that apply to every search, for every customer.
 *
 * This is guidance, not enforcement. Anything that MUST hold is checked in code
 * after the model answers — codes and municipalities are validated against the
 * real lists, and no company name ever comes from the model. Put judgement calls
 * here; put guarantees in the code.
 *
 * Safe to edit without touching anything else.
 */
const REGLER = [
  "Du hjelper norske B2B-selgere å finne bedrifter de kan selge til.",
  "Velg alltid kjøperne, aldri andre som selger det samme. Den som selger gravemaskiner skal treffe entreprenører, ikke maskinforhandlere.",
  "Sier brukeren uttrykkelig hvem kunden er, følger du det — også når produktet normalt selges til noen andre.",
  "Er teksten et merke- eller modellnavn, finn først ut hva slags produkt det er, og deretter hvilken bransje som kjøper det.",
  "Velg heller tre presise bransjekoder enn fire brede. Treffsikkerhet betyr mer enn antall.",
  "Nevner brukeren ikke sted, la kommunelisten stå tom. Ikke gjett geografi.",
  "Begrunnelsen skal være én kort setning på norsk, uten markedsføringsspråk.",
];

/**
 * Which model interprets the query. Haiku is the right default: picking codes
 * from a fixed list is a narrow task, and it is roughly three times cheaper
 * than Sonnet. Override with ANTHROPIC_MODEL to change it without a deploy.
 */
function modell() {
  return process.env.ANTHROPIC_MODEL?.trim() || "claude-haiku-4-5-20251001";
}

/** True once an API key is configured — nothing calls Anthropic before that. */
export function aiEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

/**
 * Entry point. Uses the AI pass when a key exists, otherwise the local matcher.
 * Both return the same shape, so the rest of the app never needs to care.
 */
export async function interpret(tekst: string): Promise<Interpretation | null> {
  if (aiEnabled()) {
    const viaAi = await interpretWithAi(tekst);
    if (viaAi) return viaAi;
  }
  return matchLocally(tekst);
}

/**
 * The paid path, dormant until ANTHROPIC_API_KEY is set. It only ever picks
 * codes that already exist in naeringskoder.json — the model cannot invent one,
 * and it never produces company names. Those come from the register alone.
 */
/**
 * The paid path. Dormant until ANTHROPIC_API_KEY is set.
 *
 * The model reads the whole query and fills in one search: industry codes,
 * municipalities, company size and how many results to return. It picks only
 * from lists it is handed — 738 industry codes and 358 municipalities — so it
 * can neither invent a code nor a place, and it never produces company names.
 * Those come from the register alone.
 */
async function interpretWithAi(tekst: string): Promise<Interpretation | null> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;

  const verktoy = {
    name: "sett_sokefilter",
    description:
      "Sett opp søket i Enhetsregisteret som finner bedriftene brukeren kan selge til.",
    input_schema: {
      type: "object" as const,
      properties: {
        naeringskoder: {
          type: "array",
          items: { type: "string" },
          description:
            "1–4 bransjekoder for hvem som KJØPER dette, valgt kun fra kodelisten.",
        },
        kommunenummer: {
          type: "array",
          items: { type: "string" },
          description:
            "Kommunenumre fra kommunelisten. Tom hvis brukeren ikke nevner sted. " +
            "Nevner de et område eller fylke, ta med alle kommunene som hører til.",
        },
        fraAntallAnsatte: { type: "number", description: "Utelat hvis ikke nevnt." },
        tilAntallAnsatte: { type: "number", description: "Utelat hvis ikke nevnt." },
        antall: {
          type: "number",
          description: "Hvor mange treff brukeren ba om. Utelat hvis de ikke sa et tall.",
        },
        offentlig: {
          type: "boolean",
          description:
            "True hvis kjøperne er kommuner, fylker eller offentlig sektor — de er " +
            "ikke aksjeselskap og må søkes opp som KOMM og FYLK. " +
            "FALSE hvis brukeren uttrykkelig sier de IKKE vil ha offentlige, bare " +
            "private bedrifter. Velg da bransjekoder for private selskaper i stedet " +
            "for 84-kodene (offentlig administrasjon). Utelat feltet hvis de ikke " +
            "sier noe om det.",
        },
        begrunnelse: {
          type: "string",
          description: "Én kort setning på norsk om hvem du søkte etter og hvorfor.",
        },
      },
      required: ["naeringskoder", "begrunnelse"],
    },
  };

  const kodeliste = KODER.map((k) => `${k.k} ${k.n}`).join("\n");
  const kommuneliste = KOMMUNER.map((k) => `${k.k} ${k.n} (${FYLKE[k.f] ?? ""})`).join("\n");

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
        max_tokens: 1024,
        system: REGLER.join(String.fromCharCode(10)),
        tools: [verktoy],
        tool_choice: { type: "tool", name: "sett_sokefilter" },
        messages: [
          {
            role: "user",
            content: [
              // Both lists are identical on every call, so cache them. After the
              // first search the cost is the query alone, not 12k tokens of
              // reference data.
              {
                type: "text",
                text:
                  `BRANSJEKODER (SN2025):\n${kodeliste}\n\n` +
                  `KOMMUNER:\n${kommuneliste}`,
                cache_control: { type: "ephemeral" },
              },
              {
                type: "text",
                text:
                  `Brukeren skrev: "${tekst}"\n\n` +
                  `Sett opp søket som finner bedriftene de kan selge TIL — kundene, ` +
                  `ikke andre som selger det samme. Er teksten et merke- eller ` +
                  `modellnavn, finn først ut hva slags produkt det er, og deretter ` +
                  `hvilken bransje som kjøper det.\n` +
                  `Bruk kun koder og kommunenumre fra listene over.`,
              },
            ],
          },
        ],
      }),
    });
    if (!res.ok) return null;

    const json = await res.json();
    const bruk = (json?.content ?? []).find((c: { type?: string }) => c?.type === "tool_use");
    if (!bruk?.input) return null;

    // Whatever the model returns is checked against the real lists before use.
    const gyldigeKoder = new Set(KODER.map((k) => k.k));
    const koder: string[] = (bruk.input.naeringskoder ?? [])
      .map(String)
      .filter((k: string) => gyldigeKoder.has(k))
      .slice(0, 4);
    if (koder.length === 0) return null;

    const gyldigeKommuner = new Set(KOMMUNER.map((k) => k.k));
    const kommuner: string[] = (bruk.input.kommunenummer ?? [])
      .map(String)
      .filter((k: string) => gyldigeKommuner.has(k))
      .slice(0, 40);

    const antall = Number(bruk.input.antall);

    // "Kun private bedrifter" has to survive the whole path: without dropping
    // the 84-codes here, formerFor would see them and put the municipalities
    // straight back in.
    const baPrivat = bruk.input.offentlig === false;
    const brukteKoder = baPrivat ? koder.filter((k) => !k.startsWith("84.")) : koder;
    if (brukteKoder.length === 0) return null;

    const former = baPrivat
      ? ["AS", "ASA"]
      : bruk.input.offentlig === true
        ? ["AS", "KOMM", "FYLK"]
        : formerFor(brukteKoder);

    const navn = kommuner
      .map((k) => KOMMUNER.find((x) => x.k === k)?.n)
      .filter(Boolean);
    const deler = [String(bruk.input.begrunnelse ?? "").slice(0, 200)];
    if (navn.length) {
      deler.push(
        navn.length <= 4
          ? `sted: ${navn.join(", ")}`
          : `sted: ${navn.slice(0, 3).join(", ")} +${navn.length - 3} kommuner`
      );
    }
    if (Number.isFinite(antall) && antall > 0) deler.push(`inntil ${Math.min(antall, 100)}`);

    return {
      filter: {
        naeringskoder: brukteKoder,
        kommunenummer: kommuner.length ? kommuner : undefined,
        fraAntallAnsatte: Number(bruk.input.fraAntallAnsatte) || undefined,
        tilAntallAnsatte: Number(bruk.input.tilAntallAnsatte) || undefined,
        organisasjonsformer: former,
      },
      antall: Number.isFinite(antall) && antall > 0 ? Math.min(antall, 100) : undefined,
      forklaring: deler.join(" · "),
      kilde: "ai",
    };
  } catch {
    return null;
  }
}
