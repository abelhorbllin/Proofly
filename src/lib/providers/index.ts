import { MockStoreDataProvider } from "@/lib/providers/mock/mock-store-provider";
import { MockProductDataProvider } from "@/lib/providers/mock/mock-product-provider";
import { MockAdDataProvider } from "@/lib/providers/mock/mock-ad-provider";
import { MockTrafficDataProvider } from "@/lib/providers/mock/mock-traffic-provider";
import { MockRevenueDataProvider } from "@/lib/providers/mock/mock-revenue-provider";
import type {
  AdDataProvider,
  ProductDataProvider,
  RevenueDataProvider,
  StoreDataProvider,
  TrafficDataProvider,
} from "@/lib/providers/types";

// Provider selection is centralized here so a real, licensed data provider
// can be dropped in later (STORE_PROVIDER_API_KEY / AD_PROVIDER_API_KEY /
// TRAFFIC_PROVIDER_API_KEY) without touching any call site. Every call site
// depends only on the interfaces in ./types, never on a concrete provider.

export function getStoreDataProvider(): StoreDataProvider {
  // if (process.env.STORE_PROVIDER_API_KEY) return new LiveStoreDataProvider();
  return new MockStoreDataProvider();
}

export function getProductDataProvider(): ProductDataProvider {
  // if (process.env.STORE_PROVIDER_API_KEY) return new LiveProductDataProvider();
  return new MockProductDataProvider();
}

export function getAdDataProvider(): AdDataProvider {
  // if (process.env.AD_PROVIDER_API_KEY) return new LiveAdDataProvider();
  return new MockAdDataProvider();
}

export function getTrafficDataProvider(): TrafficDataProvider {
  // if (process.env.TRAFFIC_PROVIDER_API_KEY) return new LiveTrafficDataProvider();
  return new MockTrafficDataProvider();
}

export function getRevenueDataProvider(): RevenueDataProvider {
  return new MockRevenueDataProvider();
}

export * from "@/lib/providers/types";
