import type { Resend } from "resend";
import type { createAdminClient } from "@/lib/supabase/server";

const MAX_ATTACHMENT = 25 * 1024 * 1024;

type Admin = ReturnType<typeof createAdminClient>;

/** Writes the activity + documents for a matched e-mail. Exported for the "place manually" action. */
export async function logOnDeal(
  admin: Admin,
  resend: Resend,
  p: {
    orgId: string; dealId: string; emailId: string; senderId: string; senderName: string;
    subject: string; bodyText: string; receivedAt: string; recipients: string[];
    attachments: { id: string; filename: string | null; size: number; content_type: string; content_disposition: string | null }[];
  }
) {
  const note = [`Til: ${p.recipients.join(", ")}`, p.bodyText].filter(Boolean).join("\n\n");
  await admin.from("activities").insert({
    deal_id: p.dealId,
    org_id: p.orgId,
    actor_id: p.senderId,
    actor_name: p.senderName,
    icon: "mail",
    label: `E-post: ${p.subject}`,
    note,
    created_at: p.receivedAt,
  });
  await admin.from("deals").update({ updated_at: new Date().toISOString() }).eq("id", p.dealId);

  // Real attachments (skip inline images / signatures) → documents.
  const files = p.attachments.filter(
    (a) => a.content_disposition !== "inline" && a.size > 0 && a.size <= MAX_ATTACHMENT && a.filename
  );
  for (const a of files) {
    try {
      const { data: att } = await resend.emails.receiving.attachments.get({ emailId: p.emailId, id: a.id });
      if (!att?.download_url) continue;
      const buf = Buffer.from(await (await fetch(att.download_url)).arrayBuffer());
      const safe = (a.filename as string).replace(/[^\w.\-æøåÆØÅ ]+/g, "_");
      const path = `${p.orgId}/${p.dealId}/${crypto.randomUUID()}-${safe}`;
      const { error: upErr } = await admin.storage
        .from("documents")
        .upload(path, buf, { contentType: a.content_type || "application/octet-stream", upsert: false });
      if (upErr) continue;
      await admin.from("deal_documents").insert({
        org_id: p.orgId,
        deal_id: p.dealId,
        name: a.filename as string,
        path,
        size: a.size,
        mime: a.content_type || "",
        uploaded_by: p.senderId,
        uploaded_by_name: p.senderName,
      });
    } catch {
      // best effort — the e-mail itself is already logged
    }
  }
}
