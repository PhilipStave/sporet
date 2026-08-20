import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// TEMPORARY: owner-only inbound-mail diagnostics (list received, test forward). Remove after debugging.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabase = await createClient();
  const bearer = req.headers.get("authorization")?.replace(/^Bearer /, "");
  const { data: { user } } = await supabase.auth.getUser(bearer || undefined);
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const { data: me } = await createAdminClient().from("profiles").select("is_superadmin").eq("id", user.id).single();
  if (!me?.is_superadmin) return NextResponse.json({ error: "owner only" }, { status: 403 });

  const resend = new Resend(process.env.RESEND_API_KEY!);
  const url = new URL(req.url);
  const forwardId = url.searchParams.get("forward");

  if (forwardId) {
    const { data: mail, error } = await resend.emails.receiving.get(forwardId);
    if (error || !mail) return NextResponse.json({ error: error?.message ?? "not found" }, { status: 404 });
    const res = await resend.emails.send({
      from: "Altiv <post@altiv.no>",
      to: process.env.FORWARD_MAIL_TO!,
      replyTo: mail.from,
      subject: mail.subject || "(uten emne)",
      text: `Fra: ${mail.from}

${mail.text ?? ""}`,
      html: mail.html ?? undefined,
    });
    return NextResponse.json({ forwardTo: process.env.FORWARD_MAIL_TO, result: res });
  }

  const list = await resend.emails.receiving.list({ limit: 10 });
  const items = (list.data?.data ?? []).map((m) => ({
    id: m.id, from: m.from, to: m.to, subject: m.subject, created_at: m.created_at,
  }));
  return NextResponse.json({ forwardTo: process.env.FORWARD_MAIL_TO ?? null, received: items });
}
