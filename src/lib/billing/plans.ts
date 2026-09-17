export type PlanId = "FREE" | "PRO" | "AGENCY";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  features: string[];
  limits: {
    storeAnalyses: number;
    productValidations: number;
    aiAnalyses: number;
    competitorsTracked: number;
    reportsGenerated: number;
  };
  stripePriceEnvVar?: string;
}

// Pricing lives here, not scattered across components, per spec section 74.
export const PLANS: Record<PlanId, PlanDefinition> = {
  FREE: {
    id: "FREE",
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    description: "Explore ADINTEL with limited analyses.",
    features: [
      "3 store analyses / month",
      "1 product validation / month",
      "5 AI analyses / month",
      "Track 1 competitor",
      "Demo data & mock providers",
    ],
    limits: {
      storeAnalyses: 3,
      productValidations: 1,
      aiAnalyses: 5,
      competitorsTracked: 1,
      reportsGenerated: 0,
    },
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    priceMonthly: 49,
    priceYearly: 470,
    description: "For entrepreneurs actively validating products.",
    features: [
      "50 store analyses / month",
      "25 product validations / month",
      "200 AI analyses / month",
      "Track 15 competitors",
      "Alerts & historical tracking",
      "10 PDF reports / month",
    ],
    limits: {
      storeAnalyses: 50,
      productValidations: 25,
      aiAnalyses: 200,
      competitorsTracked: 15,
      reportsGenerated: 10,
    },
    stripePriceEnvVar: "STRIPE_PRICE_PRO",
  },
  AGENCY: {
    id: "AGENCY",
    name: "Agency",
    priceMonthly: 99,
    priceYearly: 950,
    description: "For agencies managing multiple clients.",
    features: [
      "Unlimited store analyses",
      "Unlimited product validations",
      "1,000 AI analyses / month",
      "Track unlimited competitors",
      "Multiple client workspaces",
      "White-label reports",
      "Unlimited PDF reports",
    ],
    limits: {
      storeAnalyses: Infinity,
      productValidations: Infinity,
      aiAnalyses: 1000,
      competitorsTracked: Infinity,
      reportsGenerated: Infinity,
    },
    stripePriceEnvVar: "STRIPE_PRICE_AGENCY",
  },
};

export const PLAN_ORDER: PlanId[] = ["FREE", "PRO", "AGENCY"];
