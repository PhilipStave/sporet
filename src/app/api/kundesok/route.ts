import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { interpret, matchLocally, aiEnabled, rangerTreff } from "@/lib/lead-query";
import { searchCompanies, fetchCompany, type Lead } from "@/lib/brreg";
import { sokAnbud } from "@/lib/doffin";
import { sjekkNettside, type NettsideDom } from "@/lib/nettside";
import { hentLagrede, lagre, type Lagret } from "@/lib/nettsted-cache";

// A criteria search fetches up to sixty front pages. Measured at 1.5–6 s of
// wall time for 47 of them, worst single site 12 s — well inside this, but
// the platform default is not.
export const maxDuration = 60;

/** How long the website checks may take, all of them together. */
const FRIST_NETTSIDE_MS = 20_000;
const MAKS_SJEKKEDE = 60;
/**
 * Sixty fetches at once from one serverless function starved each other:
 * most of them hit the six-second limit and came back "ukjent". Ten at a time
 * finish in the same wall time and actually answer.
 */
const SAMTIDIGE = 10;

/**
 * Where a verdict sorts when the user asked about websites: the ones that
 * answer the question first, then the ones that might, then the ones nobody
 * can say anything about, and last the ones that plainly do not fit.
 */
const REKKEFOLGE: Record<NettsideDom, number> = {
  mangler: 0,
  daarlig: 0,
  svak: 1,
  ukjent: 2,
  ingen_registrert: 3,
  ok: 4,
};

/**
 * Measure every company's website — from the cache where the verdict is
 * fresh, otherwise by fetching the front page — within one shared deadline.
 * A site that does not answer in time is "ukjent", never "daarlig".
 */
async function vurderNettsider(leads: Lead[]): Promise<{ antall: number; ikkeRukket: number }> {
  const medDomene = leads.filter((l) => l.hjemmeside).slice(0, MAKS_SJEKKEDE);
  const domener = [...new Set(medDomene.map((l) => l.hjemmeside!))];
  const lagrede = await hentLagrede(domener);
  const mangler = domener.filter((d) => !lagrede.has(d));

  const slutt = Date.now() + FRIST_NETTSIDE_MS;
  const nye = new Map<string, Lagret>();
  let ikkeRukket = 0;
  const koe = [...mangler];
  const arbeider = async () => {
    for (let d = koe.shift(); d !== undefined; d = koe.shift()) {
      const igjen = slutt - Date.now();
      if (igjen <= 500) {
        ikkeRukket++;
        continue;
      }
      const v = await Promise.race<Lagret | null>([
        sjekkNettside(d, Math.min(6000, igjen)),
        new Promise<null>((r) => setTimeout(() => r(null), igjen)),
      ]);
      if (v) nye.set(d, v);
      else ikkeRukket++;
    }
  };
  await Promise.all(Array.from({ length: SAMTIDIGE }, arbeider));
  // Fire and forget: the search must not wait for the database.
  void lagre([...nye].map(([domene, v]) => ({ domene, v })));

  for (const l of leads) {
    if (!l.hjemmeside) {
      l.nettside = { dom: "ingen_registrert", funn: ["Har ikke oppgitt nettside til Brønnøysund"] };
      continue;
    }
    const v = lagrede.get(l.hjemmeside) ?? nye.get(l.hjemmeside);
    l.nettside = v
      ? { dom: v.dom, funn: v.funn }
      : { dom: "ukjent", funn: ["Ikke rukket å sjekke"] };
  }
  return { antall: domener.length - ikkeRukket, ikkeRukket };
}

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
  // A criteria search takes a wider net: most of it will be sorted away once
  // the websites have been looked at.
  // Every hit in a website search gets looked at, so the list is capped at
  // what can be checked — a tail of "not checked" rows helps nobody.
  const sjekkerNettside = tolkning.kriterier.length > 0;
  const grense = Math.min(
    Math.max(tolkning.antall ?? (sjekkerNettside ? MAKS_SJEKKEDE : 40), 1),
    sjekkerNettside ? MAKS_SJEKKEDE : 100
  );
  const { leads, total } = await searchCompanies(tolkning.filter, grense);

  // The part the owner asked for: when the search is about websites, go and
  // look at them. Then the ones that answer the question come first, on the
  // measurement alone — before any model has had a say.
  let sjekket: { antall: number; ikkeRukket: number } | null = null;
  if (sjekkerNettside && leads.length > 0) {
    sjekket = await vurderNettsider(leads);
    leads.sort(
      (a, b) =>
        REKKEFOLGE[a.nettside?.dom ?? "ukjent"] - REKKEFOLGE[b.nettside?.dom ?? "ukjent"]
    );
  }

  // Relevance pass, AI searches only: read what the top hits say they actually
  // do (the register's free-text activity field) and put the best prospects
  // first, each with a one-line why. Reorder and annotate — never drop. For a
  // website search the model may only reorder within what the measurement
  // already decided.
  if (tolkning.kilde === "ai" && leads.length >= 3) {
    const topp = leads.slice(0, 25);
    const rangering = await rangerTreff(
      tekst,
      topp.map((l) => ({
        orgnr: l.orgnr,
        navn: l.navn,
        naering: l.naering,
        aktivitet: (l.aktivitet ?? "").slice(0, 300),
        ansatte: l.ansatte,
        registrert: l.registrert,
        nettside: l.nettside,
      })),
      tolkning.kriterier
    );
    if (rangering) {
      const rangerte = [...rangering.keys()]
        .map((o) => leads.find((l) => l.orgnr === o))
        .filter((l): l is NonNullable<typeof l> => Boolean(l))
        .map((l) => ({ ...l, hvorfor: rangering.get(l.orgnr) || undefined }));
      const resten = leads.filter((l) => !rangering.has(l.orgnr));
      leads.splice(0, leads.length, ...rangerte, ...resten);
      // The measurement outranks the model's opinion. Stable sort keeps the
      // model's order within each group.
      if (sjekkerNettside)
        leads.sort(
          (a, b) =>
            REKKEFOLGE[a.nettside?.dom ?? "ukjent"] - REKKEFOLGE[b.nettside?.dom ?? "ukjent"]
        );
    }
  }

  // A company with an open public tender is not a maybe — it is a buyer with
  // a budget and a deadline, and that outranks every other signal we have.
  //
  // So they are not merely marked, they are *added*: the register search ranks
  // by size, and the municipality actually out shopping is usually a small one
  // that would never reach the first page. Sirdal kommune buying a sweeper is
  // the whole point of the search; being number 400 by headcount is not.
  // The quota was claimed once above; it has to cover the tender search too,
  // or one search is four model calls and the quota counts one.
  const anbud = await sokAnbud(tekst, 40, undefined, brukAi);
  // sokAnbud returns newest first, and Map keeps the *last* write per key —
  // so building it straight from the list would show a buyer's oldest open
  // notice. The seller wants the one that just came out.
  const perOrgnr = new Map<string, (typeof anbud)[number]>();
  for (const a of anbud) {
    if (a.kjoperOrgnr && !perOrgnr.has(a.kjoperOrgnr)) perOrgnr.set(a.kjoperOrgnr, a);
  }

  if (perOrgnr.size > 0) {
    const finnes = new Set(leads.map((l) => l.orgnr));
    const mangler = [...perOrgnr.keys()].filter((o) => !finnes.has(o)).slice(0, 8);
    const hentede = (await Promise.all(mangler.map((o) => fetchCompany(o)))).filter(
      (d): d is NonNullable<typeof d> => Boolean(d)
    );

    const merk = (l: (typeof leads)[number]) => {
      const a = perOrgnr.get(l.orgnr);
      return a
        ? { ...l, anbud: a }
        : l;
    };

    const alle = [...hentede.map(merk), ...leads.map(merk)];
    alle.sort((a, b) => Number(Boolean(b.anbud)) - Number(Boolean(a.anbud)));
    leads.splice(0, leads.length, ...alle);
  }

  // A website search is ordered by the measurement, full stop. The tender
  // buyers merged in above were never looked at, so they are marked as such
  // and sorted behind everything that was — not put on top because they
  // happen to have a tender out.
  if (sjekkerNettside) {
    for (const l of leads)
      if (!l.nettside) l.nettside = { dom: "ukjent", funn: ["Ikke sjekket"] };
    leads.sort(
      (a, b) =>
        REKKEFOLGE[a.nettside?.dom ?? "ukjent"] - REKKEFOLGE[b.nettside?.dom ?? "ukjent"]
    );
  }

  const svar = {
    leads,
    total,
    forklaring: tolkning.forklaring,
    kilde: tolkning.kilde,
    kriterier: tolkning.kriterier,
    kanIkkeSjekkes: tolkning.kanIkkeSjekkes,
    sjekket: sjekket
      ? {
          ...sjekket,
          ingenRegistrert: leads.filter((l) => l.nettside?.dom === "ingen_registrert").length,
          // Only the ones that were actually fetched and still could not be
          // judged — bot walls, timeouts, pages built in the browser.
          ukjent: leads.filter(
            (l) => l.nettside?.dom === "ukjent" && !/^Ikke (rukket|sjekket)/.test(l.nettside.funn[0] ?? "")
          ).length,
          ikkeSjekket: leads.filter(
            (l) => l.nettside?.dom === "ukjent" && /^Ikke (rukket|sjekket)/.test(l.nettside.funn[0] ?? "")
          ).length,
        }
      : null,
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
