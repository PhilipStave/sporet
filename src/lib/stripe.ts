import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** Server-only Stripe client. Throws a friendly error if the key is missing. */
export function stripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY mangler i miljøvariablene.");
  _stripe = new Stripe(key);
  return _stripe;
}

export function stripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
