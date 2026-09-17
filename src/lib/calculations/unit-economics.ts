// Transparent, documented unit economics formulas — spec section 19/70.
// Every function here is pure and deterministic so results can be shown
// with the exact formula that produced them (spec section 72).

export interface UnitEconomicsInput {
  sellingPrice: number;
  productCost: number;
  shippingCost: number;
  paymentFeePct: number; // e.g. 2.9
  refundRatePct: number; // e.g. 5
}

export interface UnitEconomicsResult {
  grossProfitPerOrder: number;
  grossMarginPct: number;
  paymentFeeAmount: number;
  refundLossAmount: number;
  breakEvenCAC: number;
  breakEvenROAS: number;
}

export function computeUnitEconomics(input: UnitEconomicsInput): UnitEconomicsResult {
  const paymentFeeAmount = Number((input.sellingPrice * (input.paymentFeePct / 100)).toFixed(2));
  const refundLossAmount = Number((input.sellingPrice * (input.refundRatePct / 100)).toFixed(2));

  const grossProfitPerOrder = Number(
    (input.sellingPrice - input.productCost - input.shippingCost - paymentFeeAmount - refundLossAmount).toFixed(2)
  );
  const grossMarginPct = input.sellingPrice > 0 ? Number(((grossProfitPerOrder / input.sellingPrice) * 100).toFixed(1)) : 0;

  // Break-even CAC: the maximum you can spend acquiring one customer before losing money on that order.
  const breakEvenCAC = Math.max(0, grossProfitPerOrder);
  // Break-even ROAS: revenue you need per €1 of ad spend to break even = sellingPrice / breakEvenCAC.
  const breakEvenROAS = breakEvenCAC > 0 ? Number((input.sellingPrice / breakEvenCAC).toFixed(2)) : Infinity;

  return { grossProfitPerOrder, grossMarginPct, paymentFeeAmount, refundLossAmount, breakEvenCAC, breakEvenROAS };
}

export interface RevenueSimulationInput {
  monthlyTraffic: number;
  conversionRatePct: number;
  aov: number;
  grossMarginPct: number; // 0-100, from unit economics
  monthlyAdSpend: number;
}

export interface RevenueSimulationResult {
  estimatedOrders: number;
  estimatedRevenue: number;
  estimatedGrossProfit: number;
  estimatedContributionProfit: number;
}

export function simulateRevenue(input: RevenueSimulationInput): RevenueSimulationResult {
  const estimatedOrders = Math.round(input.monthlyTraffic * (input.conversionRatePct / 100));
  const estimatedRevenue = Math.round(estimatedOrders * input.aov);
  const estimatedGrossProfit = Math.round(estimatedRevenue * (input.grossMarginPct / 100));
  const estimatedContributionProfit = Math.round(estimatedGrossProfit - input.monthlyAdSpend);

  return { estimatedOrders, estimatedRevenue, estimatedGrossProfit, estimatedContributionProfit };
}

export type Scenario = "CONSERVATIVE" | "BASE" | "OPTIMISTIC";

export const SCENARIO_MULTIPLIERS: Record<Scenario, { traffic: number; conversion: number; adSpend: number }> = {
  CONSERVATIVE: { traffic: 0.7, conversion: 0.8, adSpend: 1.15 },
  BASE: { traffic: 1, conversion: 1, adSpend: 1 },
  OPTIMISTIC: { traffic: 1.35, conversion: 1.25, adSpend: 0.9 },
};
