import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** Trim whitespace/newlines that often sneak in when keys are pasted. */
function cleanKey(): string {
  return (process.env.STRIPE_SECRET_KEY || "").replace(/\s+/g, "");
}

/** Server-only Stripe client. Throws a friendly error if the key is missing. */
export function stripe(): Stripe {
  if (_stripe) return _stripe;
  const key = cleanKey();
  if (!key) throw new Error("STRIPE_SECRET_KEY mangler i miljøvariablene.");
  _stripe = new Stripe(key, {
    timeout: 20000,
    maxNetworkRetries: 2,
  });
  return _stripe;
}

export function stripeConfigured(): boolean {
  return cleanKey().length > 0;
}

/** Non-secret diagnostics for error messages: which kind of key is loaded. */
export function stripeKeyInfo(): string {
  const k = cleanKey();
  if (!k) return "ingen nøkkel";
  const kind = k.startsWith("sk_test_")
    ? "test"
    : k.startsWith("sk_live_")
    ? "LIVE"
    : k.startsWith("rk_")
    ? "restricted"
    : "ukjent type";
  return `${kind}, ${k.length} tegn, starter med ${k.slice(0, 8)}…`;
}
