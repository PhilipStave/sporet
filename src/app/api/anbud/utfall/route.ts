import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hentUtfall, type Utfall } from "@/lib/doffin";

// How the tenders we are following ended. Signed-in users only, same as the
// rest of the Doffin endpoints — public data, but not an open proxy.

// Each id is up to two calls to Doffin, and Next caches them for six hours, so
// a cold batch is the slow case worth allowing for.
export const maxDuration = 60;

/** Small enough that a page load never waits long on it. */
const MAKS = 10;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

  let ider: string[] = [];
  try {
    const body = await req.json();
    ider = (Array.isArray(body?.ider) ? body.ider : [])
      .map((i: unknown) => String(i).trim())
      .filter((i: string) => i.length > 0 && i.length < 40)
      .slice(0, MAKS);
  } catch {
    return NextResponse.json({ error: "Ugyldig forespørsel" }, { status: 400 });
  }
  if (ider.length === 0) return NextResponse.json({ utfall: {} });

  const svar = await Promise.all(ider.map((id) => hentUtfall(id)));

  const utfall: Record<string, Utfall> = {};
  ider.forEach((id, i) => {
    const u = svar[i];
    if (u) utfall[id] = u;
  });
  return NextResponse.json({ utfall });
}
