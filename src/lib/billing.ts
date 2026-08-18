import type { Organization } from "@/types";
import type { Plan } from "@/types/database";

/** Subscription plans. Price IDs come from Stripe (env) so they can differ per environment. */
export const PLANS: {
  id: Exclude<Plan, "trial">;
  users: number;
  price: number; // NOK per month ex. VAT
  label: string;
  envKey: string;
}[] = [
  { id: "10", users: 10, price: 500, label: "Inntil 10 brukere", envKey: "STRIPE_PRICE_10" },
  { id: "20", users: 20, price: 900, label: "Inntil 20 brukere", envKey: "STRIPE_PRICE_20" },
  { id: "50", users: 50, price: 2000, label: "Inntil 50 brukere", envKey: "STRIPE_PRICE_50" },
  { id: "100", users: 100, price: 3000, label: "Inntil 100 brukere", envKey: "STRIPE_PRICE_100" },
];

export const TRIAL_DAYS = 14;

export function planById(id: string | null | undefined) {
  return PLANS.find((p) => p.id === id) || null;
}

export function priceIdFor(planId: string): string | undefined {
  const p = planById(planId);
  return p ? process.env[p.envKey] : undefined;
}

export function planFromPriceId(priceId: string): Plan | null {
  const p = PLANS.find((x) => process.env[x.envKey] === priceId);
  return p ? p.id : null;
}

export interface Access {
  /** May the org create/edit data right now? */
  canWrite: boolean;
  /** Human-readable state for banners/settings. */
  state: "trial" | "active" | "past_due" | "expired" | "canceled";
  daysLeft: number | null; // for trial / until period end
  message: string;
}

/** Mirrors org_can_write() in SQL so the UI matches what RLS enforces. */
export function computeAccess(org: Organization): Access {
  const now = Date.now();
  const trialEnd = new Date(org.trial_ends_at).getTime();
  const periodEnd = org.current_period_end
    ? new Date(org.current_period_end).getTime()
    : null;
  const days = (t: number) => Math.max(0, Math.ceil((t - now) / 86_400_000));

  if (org.subscription_status === "active") {
    return {
      canWrite: true,
      state: "active",
      daysLeft: periodEnd ? days(periodEnd) : null,
      message: "Abonnementet er aktivt.",
    };
  }
  if (org.subscription_status === "trialing") {
    if (trialEnd > now) {
      const d = days(trialEnd);
      return {
        canWrite: true,
        state: "trial",
        daysLeft: d,
        message: `Gratis prøveperiode — ${d} ${d === 1 ? "dag" : "dager"} igjen.`,
      };
    }
    return {
      canWrite: false,
      state: "expired",
      daysLeft: 0,
      message: "Prøveperioden er over. Velg en pakke for å fortsette å legge inn og endre data.",
    };
  }
  if (org.subscription_status === "past_due") {
    const ok = periodEnd ? periodEnd > now : false;
    return {
      canWrite: ok,
      state: "past_due",
      daysLeft: periodEnd ? days(periodEnd) : 0,
      message: ok
        ? "Siste betaling feilet. Oppdater betalingskortet for å unngå at tilgangen stopper."
        : "Betalingen har feilet og perioden er utløpt. Oppdater betalingskortet for å fortsette.",
    };
  }
  if (org.subscription_status === "canceled") {
    const ok = periodEnd ? periodEnd > now : false;
    return {
      canWrite: ok,
      state: ok ? "active" : "canceled",
      daysLeft: periodEnd ? days(periodEnd) : 0,
      message: ok
        ? `Abonnementet er sagt opp og stopper om ${days(periodEnd!)} dager.`
        : "Abonnementet er avsluttet. Velg en pakke for å fortsette.",
    };
  }
  return {
    canWrite: false,
    state: "expired",
    daysLeft: 0,
    message: "Abonnementet er utløpt. Velg en pakke for å fortsette.",
  };
}
