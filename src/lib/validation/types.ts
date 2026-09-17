import type { Signal } from "@/lib/analysis/compute-signals";
import type { UnitEconomicsResult } from "@/lib/calculations/unit-economics";
import type { ValidationAssessment } from "@/lib/ai/schemas";

export interface ValidationCompetitor {
  storeId: string;
  name: string;
  domain: string;
  activeAds: number;
  totalAds: number;
  platforms: string[];
  price: number | null;
  currency: string;
}

export interface ValidationAdSignals {
  totalAds: number;
  activeAds: number;
  formats: Record<string, number>;
  angles: string[];
  offers: string[];
  ctas: string[];
}

export interface ValidationBusinessEstimate {
  trafficLow: number;
  trafficHigh: number;
  revenueLow: number;
  revenueHigh: number;
  adSpendLow: number;
  adSpendHigh: number;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  currency: string;
}

export interface ValidationReport {
  productName: string;
  productUrl: string | null;
  sellingPrice: number;
  currency: string;
  marketSignals: Signal[];
  competitorActivity: ValidationCompetitor[];
  adSignals: ValidationAdSignals;
  businessEstimates: ValidationBusinessEstimate | null;
  unitEconomics: (UnitEconomicsResult & { sellingPrice: number; productCost: number; shippingCost: number }) | null;
  aiAssessment: ValidationAssessment;
  generatedAt: string;
}
