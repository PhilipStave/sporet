import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchCompany, fetchRegnskap } from "@/lib/brreg";
import { finnKontakt, TOM_KONTAKT, type Kontakt } from "@/lib/kontakt";

// Full record for the companies a user actually picks, so imported customers
// carry as much real detail as the register holds.

// Visiting up to 25 company websites, several pages each, takes real time.
// Without headroom the whole request dies on the platform's default limit and
// nobody gets contact details — the failure this guards against was silent.
export const maxDuration = 60;

/** Leave time to serialise and answer, whatever the slowest site is doing. */
const FRIST_MS = 45_000;

/**
 * Never let one unreachable website sink the batch: whoever is not done when
 * the clock runs out is returned empty, and everyone else keeps their result.
 */
function medFrist(p: Promise<Kontakt>, ms: number): Promise<Kontakt> {
  if (ms <= 0) return Promise.resolve(TOM_KONTAKT);
  return Promise.race([
    p,
    new Promise<Kontakt>((r) => setTimeout(() => r(TOM_KONTAKT), ms)),
  ]);
}

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
      .slice(0, 25);
  } catch {
    return NextResponse.json({ error: "Ugyldig forespørsel" }, { status: 400 });
  }
  if (orgnr.length === 0) return NextResponse.json({ detaljer: [] });

  const detaljer = (await Promise.all(orgnr.map((o) => fetchCompany(o)))).filter(Boolean);

  // Contact details from the company's own site, plus the public accounts.
  // Both are best-effort: a missing website or unfiled accounts is normal.
  const slutt = Date.now() + FRIST_MS;
  const berikede = await Promise.all(
    detaljer.map(async (d) => {
      const [kontakt, regnskap] = await Promise.all([
        medFrist(
          finnKontakt(d!.navn, d!.orgnr, d!.hjemmeside, {
            epost: d!.epost,
            telefon: d!.telefon,
          }),
          slutt - Date.now()
        ),
        fetchRegnskap(d!.orgnr),
      ]);
      return { ...d!, kontakt, regnskap };
    })
  );

  return NextResponse.json({ detaljer: berikede });
}
