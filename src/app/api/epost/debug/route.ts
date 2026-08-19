import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// TEMPORARY: admin-only inspector for a received e-mail (remove after verifying payload shape).
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabase = await createClient();
  const bearer = req.headers.get("authorization")?.replace(/^Bearer /, "");
  const { data: { user } } = await supabase.auth.getUser(bearer || undefined);
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const { data: me } = await createAdminClient().from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return NextResponse.json({ error: "admin" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id" }, { status: 400 });
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const res = await resend.emails.receiving.get(id);
  return NextResponse.json(res);
}
