"use server";

import { Resend } from "resend";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { logOnDeal } from "@/lib/inbound-log";

export interface InboundResult {
  ok?: boolean;
  error?: string;
}

/** Place an unmatched inbound e-mail on a customer: logs activity + attachments, marks it matched. */
export async function placeInboundEmail(inboundId: string, dealId: string): Promise<InboundResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Ikke innlogget" };
  const { data: me } = await supabase.from("profiles").select("id, org_id, full_name").eq("id", user.id).single();
  if (!me?.org_id) return { error: "Fant ikke profil" };

  const admin = createAdminClient();
  const { data: mail } = await admin.from("inbound_emails").select("*").eq("id", inboundId).single();
  if (!mail || mail.org_id !== me.org_id) return { error: "Fant ikke e-posten" };
  if (mail.status === "matched" && mail.deal_id) return { error: "Allerede plassert" };

  const { data: deal } = await admin.from("deals").select("id, org_id").eq("id", dealId).single();
  if (!deal || deal.org_id !== me.org_id) return { error: "Fant ikke kunden" };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { error: "E-post er ikke konfigurert" };
  const resend = new Resend(apiKey);
  const { data: full } = await resend.emails.receiving.get(mail.resend_id);

  await logOnDeal(admin, resend, {
    orgId: me.org_id,
    dealId,
    emailId: mail.resend_id,
    senderId: mail.sender_profile_id ?? me.id,
    senderName: mail.from_name || me.full_name,
    subject: mail.subject,
    bodyText: mail.body_text,
    receivedAt: mail.received_at,
    recipients: mail.to_emails,
    attachments: full?.attachments ?? [],
  });
  await admin.from("inbound_emails").update({ deal_id: dealId, status: "matched" }).eq("id", inboundId);
  return { ok: true };
}

/** Discard an unmatched inbound e-mail (admin or any member — it is just a holding entry). */
export async function discardInboundEmail(inboundId: string): Promise<InboundResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Ikke innlogget" };
  const { data: me } = await supabase.from("profiles").select("org_id").eq("id", user.id).single();
  const admin = createAdminClient();
  const { data: mail } = await admin.from("inbound_emails").select("org_id").eq("id", inboundId).single();
  if (!mail || mail.org_id !== me?.org_id) return { error: "Fant ikke e-posten" };
  await admin.from("inbound_emails").delete().eq("id", inboundId);
  return { ok: true };
}
