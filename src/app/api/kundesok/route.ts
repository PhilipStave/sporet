import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { interpret, matchLocally, aiEnabled, rangerTreff } from "@/lib/lead-query";
import { searchCompanies, fetchCompany } from "@/lib/brreg";

// Lead search: free text in, real companies from Enhetsregisteret out.
// Signed-in users only — the register is public, but the endpoint is not a proxy
// for anyone who finds the URL.

/**
 * Identical queries should not be paid for twice. Lives in module scope, so it
 * survives as long as the serverless instance does — a few minutes of repeated
 * searching, which is exactly when people retype the same thing.
 */
const CACHE = new Map<string, { tid: number; svar: unknown }>();
const CACHE_MS = 10 * 60 * 1000;
const CACHE_MAKS = 200;

function fraCache(key: string) {
  const t = CACHE.get(key);
  if (!t) return null;
  if (Date.now() - t.tid > CACHE_MS) {
    CACHE.delete(key);
    return null;
  }
  return t.svar;
}

function tilCache(key: string, svar: unknown) {
  if (CACHE.size >= CACHE_MAKS) {
    const eldste = CACHE.keys().next().value;
    if (eldste) CACHE.delete(eldste);
  }
  CACHE.set(key, { tid: Date.now(), svar });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }

  let tekst = "";
  try {
    const body = await req.json();
    tekst = String(body?.tekst ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Ugyldig forespørsel" }, { status: 400 });
  }

  if (tekst.length < 3) {
    return NextResponse.json({ error: "Skriv litt mer om hva du selger" }, { status: 400 });
  }
  if (tekst.length > 500) tekst = tekst.slice(0, 500);

  const cacheKey = tekst.toLowerCase().replace(/\s+/g, " ");
  const lagret = fraCache(cacheKey);
  if (lagret) return NextResponse.json(lagret);

  // Quota is only spent on searches that actually call the paid model. The
  // local matcher costs nothing, so it stays available either way.
  let kvoteBrukt: number | null = null;
  let kvote: number | null = null;
  let brukAi = aiEnabled();

  if (brukAi) {
    const { data } = await supabase.rpc("ai_bruk_ett").single<{
      tillatt: boolean;
      brukt: number;
      kvote: number;
    }>();
    kvoteBrukt = data?.brukt ?? null;
    kvote = data?.kvote ?? null;
    // Out of quota is not a dead end — fall back to the free search.
    if (data && data.tillatt === false) brukAi = false;
  }

  const tolkning = brukAi ? await interpret(tekst) : matchLocally(tekst);

  if (!tolkning) {
    return NextResponse.json({
      leads: [],
      total: 0,
      forklaring: null,
      kilde: brukAi ? "ai" : "lokal",
      kvoteBrukt,
      kvote,
      melding:
        "Fant ingen bransje som passer. Prøv å beskrive hva kunden din driver med, " +
        "ikke bare hva produktet heter — modellnavn og varemerker er ofte for smale å søke på.",
    });
  }

  // The model may have picked up a number from the query ("finn 13 kunder").
  const grense = Math.min(Math.max(tolkning.antall ?? 40, 1), 100);
  const { leads, total } = await searchCompanies(tolkning.filter, grense);

  // Relevance pass, AI searches only: read what the top hits say they actually
  // do (the register's free-text activity field) and put the best prospects
  // first, each with a one-line why. Reorder and annotate — never drop.
  if (tolkning.kilde === "ai" && leads.length >= 3) {
    const topp = leads.slice(0, 25);
    const detaljer = await Promise.all(topp.map((l) => fetchCompany(l.orgnr)));
    const rangering = await rangerTreff(
      tekst,
      topp.map((l, i) => ({
        orgnr: l.orgnr,
        navn: l.navn,
        naering: l.naering,
        aktivitet: (detaljer[i]?.aktivitet || detaljer[i]?.formaal || "").slice(0, 300),
        ansatte: l.ansatte,
        registrert: l.registrert,
      }))
    );
    if (rangering) {
      const rangerte = [...rangering.keys()]
        .map((o) => leads.find((l) => l.orgnr === o))
        .filter((l): l is NonNullable<typeof l> => Boolean(l))
        .map((l) => ({ ...l, hvorfor: rangering.get(l.orgnr) }));
      const resten = leads.filter((l) => !rangering.has(l.orgnr));
      leads.splice(0, leads.length, ...rangerte, ...resten);
    }
  }

  const svar = {
    leads,
    total,
    forklaring: tolkning.forklaring,
    kilde: tolkning.kilde,
    kvoteBrukt,
    kvote,
    // Only say something when the quota changed what the user got.
    melding:
      leads.length === 0
        ? "Ingen treff. Prøv et bredere område, eller fjern kravet til antall ansatte."
        : aiEnabled() && !brukAi
          ? "Månedens AI-søk er brukt opp. Dette søket ble kjørt uten AI."
          : null,
  };

  tilCache(cacheKey, svar);
  return NextResponse.json(svar);
}
