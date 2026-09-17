import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export function getStripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

export function getPriceIdForPlan(plan: "PRO" | "AGENCY"): string | null {
  const envVar = plan === "PRO" ? "STRIPE_PRICE_PRO" : "STRIPE_PRICE_AGENCY";
  return process.env[envVar] ?? null;
}
