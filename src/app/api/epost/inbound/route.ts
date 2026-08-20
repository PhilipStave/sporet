import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import { cleanEmailBody, emailDomain, isGenericDomain, parseAddress } from "@/lib/email-clean";
import { logOnDeal } from "@/lib/inbound-log";

// Resend inbound webhook: an e-mail sent (usually BCC) to <inbound_key>@altiv.no is logged on the
// matching customer as an activity (+ attachments as documents). Unmatched → inbound_emails (status=unmatched).
//
// Security: svix signature (RESEND_WEBHOOK_SECRET) + sender must be an active member of the org
// that owns the inbound address. Idempotent on resend email id.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const INBOUND_DOMAIN = "altiv.no";
// Company mailboxes on these domains are forwarded verbatim to FORWARD_MAIL_TO.
const FORWARD_DOMAINS = ["altiv.no", "stavesoftware.no"];
const MAX_NOTE = 4000;

function ok(body: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: true, ...body });
}

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const apiKey = process.env.RESEND_API_KEY;
  if (!secret || !apiKey) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const resend = new Resend(apiKey);
  const raw = await req.text();

  let event;
  try {
    event = resend.webhooks.verify({
      payload: raw,
      headers: {
        id: req.headers.get("svix-id") ?? "",
        timestamp: req.headers.get("svix-timestamp") ?? "",
        signature: req.headers.get("svix-signature") ?? "",
      },
      webhookSecret: secret,
    });
  } catch {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }
  if (event.type !== "email.received") return ok({ ignored: event.type });

  const emailId = event.data.email_id;
  const admin = createAdminClient();

  // Idempotency: Resend retries on non-2xx; never log twice.
  const { data: seen } = await admin.from("inbound_emails").select("id").eq("resend_id", emailId).maybeSingle();
  if (seen) return ok({ duplicate: true });

  // Fetch full content (webhook carries metadata only).
  const { data: mail, error: getErr } = await resend.emails.receiving.get(emailId);
  if (getErr || !mail) return NextResponse.json({ error: "fetch failed" }, { status: 500 });

  // Which org? Find our inbound address among all recipients (to/cc/bcc/received_for).
  const allRcpts = [
    ...(mail.to ?? []),
    ...(mail.cc ?? []),
    ...(mail.bcc ?? []),
    ...(mail.received_for ?? []),
  ].map((a) => parseAddress(a).email);
  const inboundAddr = allRcpts.find((e) => e.endsWith(`@${INBOUND_DOMAIN}`) && e.startsWith("logg-"));

  // Company mailbox (post@, hei@, support@ … on any of our domains): forward verbatim to the owner's inbox.
  if (!inboundAddr) {
    const ours = allRcpts.filter((e) => FORWARD_DOMAINS.some((d) => e.endsWith(`@${d}`)));
    const forwardTo = process.env.FORWARD_MAIL_TO;
    if (ours.length && forwardTo) {
      const domain = FORWARD_DOMAINS.find((d) => ours[0].endsWith(`@${d}`)) ?? INBOUND_DOMAIN;
      const brand = domain === "stavesoftware.no" ? "Stave Software" : "Altiv";
      const origFrom = parseAddress(mail.from);
      // Re-send under our own domain (DMARC-aligned — a passthrough of e.g. an Outlook sender
      // would fail the sender domain's DMARC and get junked). Reply-To points at the real sender.
      const banner = `Til: ${ours.join(", ")} · Fra: ${mail.from}`;
      const { error: fwdErr } = await resend.emails.send({
        from: `${brand} <post@${domain}>`,
        to: forwardTo,
        replyTo: mail.from,
        subject: mail.subject || "(uten emne)",
        text: `${banner}

${mail.text ?? ""}`,
        html: mail.html
          ? `<p style="color:#888;font-size:12px;margin:0 0 12px">${banner}</p>${mail.html}`
          : undefined,
      });
      return ok({ forwarded: ours, error: fwdErr?.message ?? null });
    }
    return ok({ ignored: "no inbound address" });
  }
  const inboundKey = inboundAddr.split("@")[0];

  const { data: org } = await admin
    .from("organizations")
    .select("id, name")
    .eq("inbound_key", inboundKey)
    .maybeSingle();
  if (!org) return ok({ ignored: "unknown inbound key" });

  // Sender must be an active member of that org.
  const from = parseAddress(mail.from);
  const { data: sender } = await admin
    .from("profiles")
    .select("id, full_name, email, status")
    .eq("org_id", org.id)
    .ilike("email", from.email)
    .maybeSingle();

  const bodyText = cleanEmailBody(mail.text, mail.html).slice(0, MAX_NOTE);
  const subject = (mail.subject || "(uten emne)").slice(0, 300);

  if (!sender || sender.status !== "active") {
    await admin.from("inbound_emails").insert({
      org_id: org.id,
      resend_id: emailId,
      from_email: from.email,
      from_name: from.name,
      to_emails: allRcpts,
      subject,
      body_text: bodyText,
      received_at: mail.created_at,
      status: "rejected",
    });
    return ok({ rejected: "sender not a member" });
  }

  // External recipients = everyone except our inbound address and the sender.
  const external = Array.from(
    new Set(allRcpts.filter((e) => e !== inboundAddr && e !== from.email && !e.endsWith(`@${INBOUND_DOMAIN}`)))
  );

  // Match deals: exact contact e-mail first, then company domain (non-generic), most recently updated wins.
  let dealId: string | null = null;
  if (external.length) {
    const { data: exact } = await admin
      .from("deals")
      .select("id, updated_at")
      .eq("org_id", org.id)
      .in("email", external)
      .order("updated_at", { ascending: false })
      .limit(1);
    if (exact?.[0]) dealId = exact[0].id;

    if (!dealId) {
      const domains = Array.from(new Set(external.map(emailDomain).filter((d) => d && !isGenericDomain(d))));
      for (const d of domains) {
        const { data: byDomain } = await admin
          .from("deals")
          .select("id, updated_at")
          .eq("org_id", org.id)
          .ilike("email", `%@${d}`)
          .order("updated_at", { ascending: false })
          .limit(1);
        if (byDomain?.[0]) { dealId = byDomain[0].id; break; }
      }
    }
  }

  const { data: inbound } = await admin
    .from("inbound_emails")
    .insert({
      org_id: org.id,
      deal_id: dealId,
      resend_id: emailId,
      from_email: from.email,
      from_name: from.name || sender.full_name,
      sender_profile_id: sender.id,
      to_emails: external,
      subject,
      body_text: bodyText,
      received_at: mail.created_at,
      status: dealId ? "matched" : "unmatched",
    })
    .select("id")
    .single();

  if (!dealId) return ok({ unmatched: true });

  await logOnDeal(admin, resend, {
    orgId: org.id,
    dealId,
    emailId,
    senderId: sender.id,
    senderName: sender.full_name,
    subject,
    bodyText,
    receivedAt: mail.created_at,
    recipients: external,
    attachments: mail.attachments ?? [],
  });

  return ok({ matched: dealId, inbound: inbound?.id });
}
