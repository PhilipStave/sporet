import { Resend } from "resend";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// Outgoing mail from Altiv itself — confirmation links and the like.
//
// Supabase can send these on its own, but only through its built-in service,
// which is rate limited to a handful of messages an hour and explicitly not
// meant for production. We already pay for Resend and already send through it,
// so the confirmation goes the same way as everything else: our domain, our
// wording, and delivery we can actually check.

const FRA = `${SITE_NAME} <post@altiv.no>`;

function klient() {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

/**
 * A plain, readable message. No images, no tracking pixels, no external CSS —
 * a confirmation mail that lands in spam is worse than no confirmation at all,
 * and the fastest way there is a mail that looks like marketing.
 */
function ramme(tittel: string, brodtekst: string, knappTekst: string, lenke: string) {
  return `<!doctype html>
<html lang="nb"><body style="margin:0;padding:24px;background:#f5f6f8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111420">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e6e8ef;border-radius:14px;padding:30px">
    <div style="font-size:19px;font-weight:700;letter-spacing:-.02em;margin-bottom:22px">${SITE_NAME}</div>
    <h1 style="font-size:21px;margin:0 0 12px;line-height:1.3">${tittel}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 22px;color:#3b4252">${brodtekst}</p>
    <a href="${lenke}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:13px 26px;border-radius:999px;font-weight:700;font-size:15px">${knappTekst}</a>
    <p style="font-size:13px;line-height:1.6;color:#626b7d;margin:24px 0 0">
      Virker ikke knappen? Kopier denne adressen inn i nettleseren:<br>
      <span style="color:#4f46e5;word-break:break-all">${lenke}</span>
    </p>
    <p style="font-size:13px;line-height:1.6;color:#626b7d;margin:18px 0 0;border-top:1px solid #e6e8ef;padding-top:16px">
      Har du ikke bedt om dette, kan du se bort fra e-posten. Da skjer det ingenting.
    </p>
  </div>
</body></html>`;
}

/** Returns false when the mail could not be sent, so the caller can say so. */
export async function sendBekreftelse(til: string, lenke: string): Promise<boolean> {
  const resend = klient();
  if (!resend) {
    console.error("sendBekreftelse: RESEND_API_KEY mangler");
    return false;
  }
  const { error } = await resend.emails.send({
    from: FRA,
    to: til,
    subject: `Bekreft e-postadressen din hos ${SITE_NAME}`,
    html: ramme(
      "Bekreft e-postadressen din",
      `Trykk på knappen under, så er kontoen klar. Lenken er personlig og virker i 24 timer.`,
      "Bekreft e-postadressen",
      lenke
    ),
    text: `Bekreft e-postadressen din hos ${SITE_NAME}\n\nÅpne denne adressen for å fullføre:\n${lenke}\n\nLenken virker i 24 timer. Har du ikke bedt om dette, kan du se bort fra e-posten.\n\n${SITE_URL}`,
  });
  if (error) {
    console.error("sendBekreftelse feilet:", error);
    return false;
  }
  return true;
}
