// Shared provider contract. Every metric a provider returns carries its
// range, confidence and methodology — never a bare number presented as fact.

export type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH";

export interface Estimate<T> {
  value: T;
  low?: number;
  high?: number;
  confidence: ConfidenceLevel;
  source: string;
  observedAt: string; // ISO date
  methodology: string;
}

export interface ProviderStoreData {
  domain: string;
  name: string;
  platform: string;
  country: string;
  category: string;
  currency: string;
  firstObservedAt: string;
  lastObservedAt: string;
}

export interface ProviderProduct {
  externalId: string;
  name: string;
  url: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  images: string[];
  description: string;
  firstObservedAt: string;
  lastObservedAt: string;
}

export type AdPlatformName = "META" | "TIKTOK" | "GOOGLE" | "OTHER";
export type AdFormatName = "VIDEO" | "IMAGE" | "CAROUSEL" | "OTHER";
export type AdAngleName =
  | "PROBLEM_SOLUTION"
  | "BEFORE_AFTER"
  | "DEMONSTRATION"
  | "UGC"
  | "TESTIMONIAL"
  | "LIFESTYLE"
  | "CURIOSITY"
  | "FOMO"
  | "DISCOUNT"
  | "SOCIAL_PROOF"
  | "EDUCATIONAL"
  | "EMOTIONAL";

export interface ProviderAdCreative {
  externalId: string;
  format: AdFormatName;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  hook: string;
  headline: string;
  primaryText: string;
  firstSeenAt: string;
  lastSeenAt: string;
  active: boolean;
}

export interface ProviderAd {
  externalId: string;
  platform: AdPlatformName;
  angle: AdAngleName;
  offer: string;
  cta: string;
  landingPageUrl: string;
  productExternalId: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  active: boolean;
  creatives: ProviderAdCreative[];
}

export interface TrafficTrendPoint {
  date: string;
  visits: number;
}

export interface ProviderTrafficData {
  monthlyVisits: Estimate<number>;
  trend: TrafficTrendPoint[];
  sources: { organic: number; paid: number; social: number; direct: number; referral: number };
  countries: { country: string; share: number }[];
  devices: { desktop: number; mobile: number; tablet: number };
}

export interface ProviderRevenueData {
  dailyRevenue: Estimate<number>;
  monthlyRevenue: Estimate<number>;
  annualRevenue: Estimate<number>;
  aov: Estimate<number>;
  conversionRate: Estimate<number>;
  monthlyAdSpend: Estimate<number>;
}

export interface StoreDataProvider {
  analyzeStore(url: string): Promise<ProviderStoreData>;
}

export interface ProductDataProvider {
  getStoreProducts(domain: string): Promise<ProviderProduct[]>;
}

export interface AdDataProvider {
  getStoreAds(domain: string, products: ProviderProduct[]): Promise<ProviderAd[]>;
  searchAds(query: string): Promise<ProviderAd[]>;
}

export interface TrafficDataProvider {
  getTraffic(domain: string): Promise<ProviderTrafficData>;
}

export interface RevenueDataProvider {
  getRevenue(
    domain: string,
    traffic: ProviderTrafficData,
    products: ProviderProduct[]
  ): Promise<ProviderRevenueData>;
}
