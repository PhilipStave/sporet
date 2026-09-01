import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sokAnbud, REGIONER } from "@/lib/doffin";

// Active Doffin notices for a search phrase. Signed-in users only, same as the
// company search — public data, but the endpoint is not an open proxy.

// A fruitless search does the most work: the phrase, then each key word, then
// a model call and the terms it suggests. Still seconds, not minutes — but the
// default limit is too tight to leave it to chance.
export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

  let tekst = "";
  let region: string | undefined;
  try {
    const body = await req.json();
    tekst = String(body?.tekst ?? "").trim();
    const r = String(body?.region ?? "").trim();
    // Only the regions we offer; anything else is ignored rather than passed on.
    if (REGIONER.some((x) => x.id === r)) region = r;
  } catch {
    return NextResponse.json({ error: "Ugyldig forespørsel" }, { status: 400 });
  }
  if (tekst.length < 3) return NextResponse.json({ anbud: [] });

  return NextResponse.json({ anbud: await sokAnbud(tekst.slice(0, 200), 12, region) });
}
