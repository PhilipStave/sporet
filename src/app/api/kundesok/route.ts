import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { interpret, aiEnabled } from "@/lib/lead-query";
import { searchCompanies } from "@/lib/brreg";

// Lead search: free text in, real companies from Enhetsregisteret out.
// Signed-in users only — the register is public, but the endpoint is not a proxy
// for anyone who finds the URL.

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

  const tolkning = await interpret(tekst);
  if (!tolkning) {
    return NextResponse.json({
      leads: [],
      total: 0,
      forklaring: null,
      kilde: aiEnabled() ? "ai" : "lokal",
      melding:
        "Fant ingen bransje som passer. Prøv å beskrive hva kunden driver med, " +
        "for eksempel «betongelementer til boligbygg» eller «regnskapstjenester til småbedrifter».",
    });
  }

  const { leads, total } = await searchCompanies(tolkning.filter, 40);

  return NextResponse.json({
    leads,
    total,
    forklaring: tolkning.forklaring,
    kilde: tolkning.kilde,
    melding:
      leads.length === 0
        ? "Ingen treff. Prøv et bredere område, eller fjern kravet til antall ansatte."
        : null,
  });
}
