export type SignalLevel = "WEAK" | "MEDIUM" | "STRONG";

export interface Signal {
  label: string;
  value: SignalLevel;
  explanation: string;
}

/**
 * Pure, deterministic signal computation from observed counts — never a
 * single opaque "score". Each signal states exactly what evidence backed it,
 * per spec section 9/18 (no fake success score, only evidence-based signals).
 */
export function computeStoreSignals(input: {
  activeAdCount: number;
  totalAdCount: number;
  productCount: number;
  distinctAngles: number;
  daysSinceFirstObserved: number;
  trafficConfidence: "LOW" | "MEDIUM" | "HIGH";
}): Signal[] {
  const advertisingActivity: SignalLevel = input.activeAdCount >= 8 ? "STRONG" : input.activeAdCount >= 3 ? "MEDIUM" : "WEAK";
  const productActivity: SignalLevel = input.productCount >= 8 ? "STRONG" : input.productCount >= 3 ? "MEDIUM" : "WEAK";
  const creativeDiversity: SignalLevel = input.distinctAngles >= 5 ? "STRONG" : input.distinctAngles >= 3 ? "MEDIUM" : "WEAK";
  const businessScale: SignalLevel = input.daysSinceFirstObserved >= 180 ? "STRONG" : input.daysSinceFirstObserved >= 60 ? "MEDIUM" : "WEAK";

  return [
    {
      label: "Advertising activity",
      value: advertisingActivity,
      explanation: `${input.activeAdCount} of ${input.totalAdCount} observed ads are currently active.`,
    },
    {
      label: "Product activity",
      value: productActivity,
      explanation: `${input.productCount} products currently observed for sale on this store.`,
    },
    {
      label: "Creative diversity",
      value: creativeDiversity,
      explanation: `${input.distinctAngles} distinct advertising angles detected across observed ads.`,
    },
    {
      label: "Estimated business scale",
      value: businessScale,
      explanation: `Store has been observed active for approximately ${input.daysSinceFirstObserved} days.`,
    },
  ];
}

export function daysBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}
