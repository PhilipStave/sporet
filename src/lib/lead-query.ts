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

/** Longest shared prefix of two words. */
function fellesPrefiks(a: string, b: string) {
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n && a[i] === b[i]) i++;
  return i;
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
        if (fellesPrefiks(nw, st) >= 5) beste = Math.max(beste, 6);
      }
      for (const bw of beskrivelseOrd) {
        if (bw === w) { beste = Math.max(beste, 2); continue; }
        if (fellesPrefiks(bw, st) >= 6) beste = Math.max(beste, 1);
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
  const koder = matchKoder(tekst);
  if (koder.length === 0) return null;

  const sted = finnSteder(tekst);
  const ansatte = finnAnsatte(tekst);

  const deler = [`bransje: ${koder.map((k) => k.n.toLowerCase()).join(", ")}`];
  if (sted.navn.length) deler.push(`sted: ${sted.navn.join(", ")}`);
  if (ansatte.fra != null && ansatte.til != null) deler.push(`${ansatte.fra}–${ansatte.til} ansatte`);
  else if (ansatte.fra != null) deler.push(`minst ${ansatte.fra} ansatte`);
  else if (ansatte.til != null) deler.push(`opp til ${ansatte.til} ansatte`);
  deler.push("aksjeselskap");

  return {
    filter: {
      naeringskoder: koder.map((k) => k.k),
      kommunenummer: sted.numre.length ? sted.numre : undefined,
      fraAntallAnsatte: ansatte.fra,
      tilAntallAnsatte: ansatte.til,
      organisasjonsform: "AS",
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
        organisasjonsform: "AS",
      },
      forklaring: String(bruk.input.begrunnelse ?? "").slice(0, 300),
      kilde: "ai",
    };
  } catch {
    return null;
  }
}
