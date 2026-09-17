import { db } from "@/lib/db";
import { getStripeClient, getPriceIdForPlan, isStripeConfigured } from "@/lib/billing/stripe";
import type { Plan } from "@prisma/client";
import type Stripe from "stripe";

const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

/**
 * Starts an upgrade to a paid plan. When Stripe is configured (STRIPE_SECRET_KEY
 * + a price id for the plan) this creates a real Checkout Session and returns
 * its URL. When it isn't configured — as in this dev environment — it applies
 * the plan directly so the rest of the product (usage limits, plan gating)
 * remains fully testable without live payment credentials.
 */
export async function startUpgrade(organizationId: string, userEmail: string, plan: "PRO" | "AGENCY") {
  const priceId = getPriceIdForPlan(plan);

  if (isStripeConfigured() && priceId) {
    const stripe = getStripeClient();
    const subscription = await db.subscription.findUnique({ where: { organizationId } });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: subscription?.stripeCustomerId ? undefined : userEmail,
      customer: subscription?.stripeCustomerId ?? undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/settings/billing?checkout=success`,
      cancel_url: `${APP_URL}/settings/billing?checkout=cancelled`,
      metadata: { organizationId, plan },
      subscription_data: { metadata: { organizationId, plan } },
    });

    return { url: session.url, mock: false };
  }

  // Mock mode: apply the plan immediately.
  await db.subscription.upsert({
    where: { organizationId },
    update: { plan, status: "ACTIVE", currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    create: { organizationId, plan, status: "ACTIVE", currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  });

  return { url: `${APP_URL}/settings/billing?checkout=mock-success`, mock: true };
}

export async function createPortalSession(organizationId: string): Promise<string | null> {
  if (!isStripeConfigured()) return null;

  const subscription = await db.subscription.findUnique({ where: { organizationId } });
  if (!subscription?.stripeCustomerId) return null;

  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${APP_URL}/settings/billing`,
  });
  return session.url;
}

export async function downgradeToFree(organizationId: string) {
  await db.subscription.upsert({
    where: { organizationId },
    update: { plan: "FREE", status: "ACTIVE", stripeSubscriptionId: null, cancelAtPeriodEnd: false },
    create: { organizationId, plan: "FREE", status: "ACTIVE" },
  });
}

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.metadata?.organizationId;
      const plan = session.metadata?.plan as Plan | undefined;
      if (!organizationId || !plan) break;

      await db.subscription.upsert({
        where: { organizationId },
        update: {
          plan,
          status: "ACTIVE",
          stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
          stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : undefined,
        },
        create: {
          organizationId,
          plan,
          status: "ACTIVE",
          stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
          stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : undefined,
        },
      });
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const organizationId = sub.metadata?.organizationId;
      if (!organizationId) break;

      const periodEndTimestamp = (sub as unknown as { current_period_end?: number }).current_period_end;
      await db.subscription.updateMany({
        where: { organizationId },
        data: {
          status: sub.status === "active" ? "ACTIVE" : sub.status === "past_due" ? "PAST_DUE" : sub.status === "trialing" ? "TRIALING" : "INCOMPLETE",
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          currentPeriodEnd: periodEndTimestamp ? new Date(periodEndTimestamp * 1000) : undefined,
        },
      });
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const organizationId = sub.metadata?.organizationId;
      if (!organizationId) break;
      await downgradeToFree(organizationId);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : undefined;
      if (!customerId) break;
      await db.subscription.updateMany({ where: { stripeCustomerId: customerId }, data: { status: "PAST_DUE" } });
      break;
    }
    default:
      break;
  }
}
