// Turns a raw e-mail body into something readable in an activity log:
// strips quoted replies, signatures and excessive blank lines. Best-effort, language-aware (nb/en).

const QUOTE_MARKERS = [
  /^-{2,}\s*Original(?:al)? Message\s*-{2,}$/im,
  /^-{2,}\s*Opprinnelig melding\s*-{2,}$/im,
  /^-{2,}\s*Videresendt melding\s*-{2,}$/im,
  /^-{2,}\s*Forwarded message\s*-{2,}$/im,
  /^(?:On|Den|På) .{3,120}(?:wrote|skrev):\s*$/im,
  /^(?:Fra|From):\s.+\n(?:Sendt|Sent):\s.+/im,
  /^_{5,}\s*$/m,
  /^>\s?.*$/m, // first quoted line
];
const SIG_MARKERS = [/^--\s*$/m, /^(?:Med vennlig hilsen|Mvh|Vennlig hilsen|Best regards|Kind regards|Regards|Hilsen)[,.]?\s*$/im];

export function cleanEmailBody(text: string | null | undefined, html?: string | null): string {
  let t = (text && text.trim()) || (html ? htmlToText(html) : "") || "";
  t = t.replace(/\r\n?/g, "\n");

  // Cut at the earliest quote marker.
  let cut = t.length;
  for (const re of QUOTE_MARKERS) {
    const m = re.exec(t);
    if (m && m.index < cut && m.index > 0) cut = m.index;
  }
  t = t.slice(0, cut);

  // Cut at signature marker (only if it leaves something meaningful).
  for (const re of SIG_MARKERS) {
    const m = re.exec(t);
    if (m && m.index > 20) {
      t = t.slice(0, m.index);
      break;
    }
  }

  t = t.replace(/\n{3,}/g, "\n\n").trim();
  return t;
}

export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6]|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

/** "Kari Holt <kari@x.no>" → { name: "Kari Holt", email: "kari@x.no" } */
export function parseAddress(s: string): { name: string; email: string } {
  const m = /^\s*(?:"?([^"<]*)"?\s*)?<([^>]+)>\s*$/.exec(s);
  if (m) return { name: (m[1] || "").trim(), email: m[2].trim().toLowerCase() };
  return { name: "", email: s.trim().toLowerCase() };
}

export function emailDomain(email: string): string {
  const i = email.lastIndexOf("@");
  return i >= 0 ? email.slice(i + 1).toLowerCase() : "";
}

const GENERIC_DOMAINS = new Set([
  "gmail.com", "hotmail.com", "hotmail.no", "outlook.com", "outlook.no", "live.no", "live.com",
  "yahoo.com", "yahoo.no", "icloud.com", "me.com", "online.no", "getmail.no", "broadpark.no",
]);
export function isGenericDomain(d: string) {
  return GENERIC_DOMAINS.has(d);
}
