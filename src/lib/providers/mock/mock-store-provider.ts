import { SeededRandom } from "@/lib/mock/random";
import { COUNTRIES, NICHES, PLATFORMS, storeNameFromDomain } from "@/lib/mock/catalog";
import type { ProviderStoreData, StoreDataProvider } from "@/lib/providers/types";

function normalizeDomain(url: string): string {
  return url
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

export class MockStoreDataProvider implements StoreDataProvider {
  async analyzeStore(url: string): Promise<ProviderStoreData> {
    const domain = normalizeDomain(url);
    const rand = new SeededRandom(domain);
    const firstObserved = rand.daysAgo(rand.int(120, 720));

    return {
      domain,
      name: storeNameFromDomain(domain, rand),
      platform: rand.pick(PLATFORMS),
      country: rand.pick(COUNTRIES),
      category: rand.pick(NICHES),
      currency: rand.pick(["EUR", "USD", "GBP"] as const),
      firstObservedAt: firstObserved.toISOString(),
      lastObservedAt: new Date().toISOString(),
    };
  }
}
