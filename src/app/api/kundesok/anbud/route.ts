import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sokAnbud } from "@/lib/doffin";

// Active Doffin notices for a search phrase. Signed-in users only, same as the
// company search — public data, but the endpoint is not an open proxy.

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

  let tekst = "";
  try {
    const body = await req.json();
    tekst = String(body?.tekst ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Ugyldig forespørsel" }, { status: 400 });
  }
  if (tekst.length < 3) return NextResponse.json({ anbud: [] });

  return NextResponse.json({ anbud: await sokAnbud(tekst.slice(0, 200)) });
}
