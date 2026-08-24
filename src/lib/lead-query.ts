import NAERINGSKODER from "@/data/naeringskoder.json";
import type { LeadFilter } from "./brreg";

// Turns "jeg selger betongelementer til boligprosjekt i Bergen" into a register query.
//
// Two implementations behind one function:
//   1. matchLocally  — plain code, costs nothing, always available.
//   2. an AI pass    — only when ANTHROPIC_API_KEY is set (see interpret()).
// The local matcher is not a stopgap: it is also the fallback if the API is down.

type Kode = { k: string; n: string; s: string };
const KODER = NAERINGSKODER as Kode[];

export type Interpretation = {
  filter: LeadFilter;
  /** Human-readable account of what we searched for, shown above the results. */
  forklaring: string;
  /** Which path produced this — surfaced in the UI so it is never a mystery. */
  kilde: "lokal" | "ai";
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

  // Who buys this? Beats word-matching, which would find competitors instead.
  const kjoper = matchKjopere(tekst);
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
async function interpretWithAi(tekst: string): Promise<Interpretation | null> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;

  // Narrow the 738 codes down locally first, so the prompt stays small and cheap.
  const kandidater = matchKoder(tekst, 40);
  if (kandidater.length === 0) return null;

  const verktoy = {
    name: "sett_sokefilter",
    description: "Velg bransjekoder og filtre som passer det brukeren vil selge.",
    input_schema: {
      type: "object" as const,
      properties: {
        naeringskoder: {
          type: "array",
          items: { type: "string" },
          description: "1–4 koder, valgt KUN fra listen du fikk.",
        },
        fraAntallAnsatte: { type: "number" },
        tilAntallAnsatte: { type: "number" },
        begrunnelse: { type: "string", description: "Én kort setning på norsk." },
      },
      required: ["naeringskoder", "begrunnelse"],
    },
  };

  const liste = kandidater.map((k) => `${k.k} ${k.n}`).join("\n");

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        tools: [verktoy],
        tool_choice: { type: "tool", name: "sett_sokefilter" },
        messages: [
          {
            role: "user",
            content:
              `Brukeren selger: "${tekst}"\n\n` +
              `Velg de mest relevante bransjekodene for hvem som ville KJØPT dette. ` +
              `Du kan bare velge blant disse kodene:\n${liste}`,
          },
        ],
      }),
    });
    if (!res.ok) return null;

    const json = await res.json();
    const bruk = (json?.content ?? []).find(
      (c: { type?: string }) => c?.type === "tool_use"
    );
    if (!bruk?.input) return null;

    const gyldige = new Set(kandidater.map((k) => k.k));
    const koder: string[] = (bruk.input.naeringskoder ?? []).filter((k: string) =>
      gyldige.has(k)
    );
    if (koder.length === 0) return null;

    const sted = finnSteder(tekst);
    const ansatte = finnAnsatte(tekst);

    return {
      filter: {
        naeringskoder: koder.slice(0, 4),
        kommunenummer: sted.numre.length ? sted.numre : undefined,
        fraAntallAnsatte: ansatte.fra ?? bruk.input.fraAntallAnsatte,
        tilAntallAnsatte: ansatte.til ?? bruk.input.tilAntallAnsatte,
        organisasjonsformer: formerFor(koder),
      },
      forklaring: String(bruk.input.begrunnelse ?? "").slice(0, 300),
      kilde: "ai",
    };
  } catch {
    return null;
  }
}
