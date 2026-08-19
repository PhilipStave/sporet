import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Downloads a vCard "Altiv logg <inbound_key@altiv.no>" so users can add the BCC address as a contact in one click.
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { data: me } = await supabase.from("profiles").select("org_id").eq("id", user.id).single();
  if (!me?.org_id) return new NextResponse("Not found", { status: 404 });
  const { data: org } = await supabase.from("organizations").select("name, inbound_key").eq("id", me.org_id).single();
  if (!org?.inbound_key) return new NextResponse("Not found", { status: 404 });

  const email = `${org.inbound_key}@altiv.no`;
  const vcf = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "N:logg;Altiv;;;",
    "FN:Altiv logg",
    `ORG:${org.name.replace(/[,;]/g, "\$&")}`,
    `EMAIL;TYPE=INTERNET,WORK:${email}`,
    "NOTE:Sett denne på BCC når du sender e-post til kunder — så logges den i Altiv.",
    "END:VCARD",
  ].join("\r\n") + "\r\n";

  return new NextResponse(vcf, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": 'attachment; filename="Altiv-logg.vcf"',
      "Cache-Control": "no-store",
    },
  });
}
