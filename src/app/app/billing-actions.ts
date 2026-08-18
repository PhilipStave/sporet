"use server";

import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { priceIdFor, planById } from "@/lib/billing";
import { SITE_URL } from "@/lib/site";

async function requireAdminOrg() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Ikke innlogget");
  const { data: me } = await supabase
    .from("profiles")
    .select("id, org_id, role, email, full_name")
    .eq("id", user.id)
    .single();
  if (!me || me.role !== "admin" || !me.org_id)
    throw new Error("Krever administrator");
  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("*")
    .eq("id", me.org_id)
    .single();
  if (!org) throw new Error("Fant ikke bedrift");
  return { me, org, admin };
}

/** Starts a Stripe Checkout session for the chosen plan and redirects to it. */
export async function startCheckout(planId: string): Promise<{ error?: string }> {
  if (!stripeConfigured())
    return { error: "Betaling er ikke satt opp ennå (mangler Stripe-nøkler)." };
  const plan = planById(planId);
  const priceId = priceIdFor(planId);
  if (!plan || !priceId)
    return { error: "Ukjent pakke, eller pris-ID mangler i miljøvariablene." };

  let url: string | null = null;
  try {
    const { me, org, admin } = await requireAdminOrg();
    const s = stripe();

    // Reuse or create the Stripe customer for this organisation.
    let customerId = org.stripe_customer_id;
    if (!customerId) {
      const customer = await s.customers.create({
        email: me.email || undefined,
        name: org.name,
        metadata: { org_id: org.id },
      });
      customerId = customer.id;
      await admin
        .from("organizations")
        .update({ stripe_customer_id: customerId })
        .eq("id", org.id);
    }

    const session = await s.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      locale: "nb",
      allow_promotion_codes: true,
      automatic_tax: { enabled: true },
      customer_update: { address: "auto", name: "auto" },
      tax_id_collection: { enabled: true },
      billing_address_collection: "required",
      subscription_data: { metadata: { org_id: org.id, plan: plan.id } },
      metadata: { org_id: org.id, plan: plan.id },
      success_url: `${SITE_URL}/app/innstillinger?betaling=ok`,
      cancel_url: `${SITE_URL}/app/innstillinger?betaling=avbrutt`,
    });
    url = session.url;
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (!url) return { error: "Kunne ikke starte betaling." };
  redirect(url);
}

/** Opens Stripe's hosted customer portal (change plan, card, cancel). */
export async function openPortal(): Promise<{ error?: string }> {
  if (!stripeConfigured())
    return { error: "Betaling er ikke satt opp ennå (mangler Stripe-nøkler)." };
  let url: string | null = null;
  try {
    const { org } = await requireAdminOrg();
    if (!org.stripe_customer_id)
      return { error: "Ingen betalingskonto ennå — velg en pakke først." };
    const session = await stripe().billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${SITE_URL}/app/innstillinger`,
      locale: "nb",
    });
    url = session.url;
  } catch (e) {
    return { error: (e as Error).message };
  }
  redirect(url);
}
