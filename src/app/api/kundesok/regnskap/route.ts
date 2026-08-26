import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchRegnskap } from "@/lib/brreg";

// Accounts only, for a whole page of search hits at once.
//
// Deliberately separate from /detalj: that one also scrapes company websites for
// contact details, which takes seconds per company. This is a single fast
// register lookup, so the result list can show turnover while the user decides
// who is worth calling.

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

  let orgnr: string[] = [];
  try {
    const body = await req.json();
    orgnr = (Array.isArray(body?.orgnr) ? body.orgnr : [])
      .map((o: unknown) => String(o).replace(/\D/g, ""))
      .filter((o: string) => o.length === 9)
      .slice(0, 50);
  } catch {
    return NextResponse.json({ error: "Ugyldig forespørsel" }, { status: 400 });
  }
  if (orgnr.length === 0) return NextResponse.json({ regnskap: {} });

  const rader = await Promise.all(
    orgnr.map(async (o) => [o, await fetchRegnskap(o)] as const)
  );

  // Keyed by org number so the client can merge it straight into its rows.
  const regnskap: Record<string, unknown> = {};
  for (const [o, r] of rader) if (r) regnskap[o] = r;

  return NextResponse.json({ regnskap });
}
