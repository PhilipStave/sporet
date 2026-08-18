import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { planFromPriceId } from "@/lib/billing";
import type { SubscriptionStatus, Plan } from "@/types/database";

export const runtime = "nodejs";

function mapStatus(s: Stripe.Subscription.Status): SubscriptionStatus {
  switch (s) {
    case "active":
    case "trialing": // paid plan with a Stripe-side trial counts as active for us
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "past_due";
  }
}

async function syncSubscription(sub: Stripe.Subscription) {
  const admin = createAdminClient();
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const orgId = (sub.metadata?.org_id as string | undefined) || null;

  const priceId = sub.items.data[0]?.price?.id || "";
  const plan: Plan | null =
    (sub.metadata?.plan as Plan | undefined) || planFromPriceId(priceId);

  // Stripe SDK v20+: period end lives on the subscription item.
  const item = sub.items.data[0];
  const periodEndUnix =
    (item as unknown as { current_period_end?: number })?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end;
  const periodEnd = periodEndUnix
    ? new Date(periodEndUnix * 1000).toISOString()
    : null;

  const status: SubscriptionStatus = sub.cancel_at_period_end
    ? "canceled"
    : mapStatus(sub.status);

  const patch = {
    stripe_subscription_id: sub.id,
    stripe_customer_id: customerId,
    subscription_status: status,
    current_period_end: periodEnd,
    ...(plan ? { plan } : {}),
  };

  const q = admin.from("organizations").update(patch);
  const { error } = orgId
    ? await q.eq("id", orgId)
    : await q.eq("stripe_customer_id", customerId);
  if (error) console.error("webhook sync error:", error.message);
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new NextResponse("Webhook not configured", { status: 500 });

  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, sig || "", secret);
  } catch (err) {
    return new NextResponse(`Invalid signature: ${(err as Error).message}`, {
      status: 400,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const sub = await stripe().subscriptions.retrieve(
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id
          );
          await syncSubscription(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const customerId =
          typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
        if (customerId) {
          await createAdminClient()
            .from("organizations")
            .update({ subscription_status: "past_due" })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("webhook handler error:", (e as Error).message);
    return new NextResponse("Handler error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
