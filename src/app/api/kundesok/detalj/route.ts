import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchCompany } from "@/lib/brreg";
import { finnKontakt } from "@/lib/kontakt";

// Full record for the companies a user actually picks, so imported customers
// carry as much real detail as the register holds.

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

  // Public contact details from the company website, where we can verify it.
  const medKontakt = await Promise.all(
    detaljer.map(async (d) => ({
      ...d!,
      kontakt: await finnKontakt(d!.navn, d!.orgnr),
    }))
  );

  return NextResponse.json({ detaljer: medKontakt });
}
