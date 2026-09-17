import { SeededRandom } from "@/lib/mock/random";
import { AD_ANGLES, CTAS, HEADLINES, HOOKS, OFFERS } from "@/lib/mock/catalog";
import type {
  AdDataProvider,
  AdFormatName,
  AdPlatformName,
  ProviderAd,
  ProviderAdCreative,
  ProviderProduct,
} from "@/lib/providers/types";

const PLATFORMS: AdPlatformName[] = ["META", "TIKTOK", "GOOGLE", "OTHER"];
const FORMATS: AdFormatName[] = ["VIDEO", "IMAGE", "CAROUSEL", "OTHER"];

function buildCreative(rand: SeededRandom, seed: string): ProviderAdCreative {
  const format = rand.pick(FORMATS);
  const firstSeen = rand.daysAgo(rand.int(5, 180));
  const active = rand.bool(0.65);
  const lastSeen = active ? new Date() : rand.daysAgo(rand.int(0, 30));
  return {
    externalId: seed,
    format,
    mediaUrl: format === "VIDEO" ? null : `https://picsum.photos/seed/${seed}/800/800`,
    thumbnailUrl: `https://picsum.photos/seed/${seed}-thumb/400/400`,
    hook: rand.pick(HOOKS),
    headline: rand.pick(HEADLINES),
    primaryText: `${rand.pick(HOOKS)} ${rand.pick(OFFERS)}.`,
    firstSeenAt: firstSeen.toISOString(),
    lastSeenAt: lastSeen.toISOString(),
    active,
  };
}

export class MockAdDataProvider implements AdDataProvider {
  async getStoreAds(domain: string, products: ProviderProduct[]): Promise<ProviderAd[]> {
    const rand = new SeededRandom(`${domain}:ads`);
    if (products.length === 0) return [];

    const adCount = rand.int(Math.max(4, products.length), products.length * 3);
    const ads: ProviderAd[] = [];

    for (let i = 0; i < adCount; i++) {
      const product = rand.pick(products);
      const firstSeen = rand.daysAgo(rand.int(3, 200));
      const active = rand.bool(0.6);
      const lastSeen = active ? new Date() : rand.daysAgo(rand.int(0, 20));
      const creativeCount = rand.int(1, 3);
      const creatives = Array.from({ length: creativeCount }, (_, c) =>
        buildCreative(rand, `${domain}-ad-${i}-creative-${c}`)
      );

      ads.push({
        externalId: `${domain}-ad-${i}`,
        platform: rand.pick(PLATFORMS),
        angle: rand.pick(AD_ANGLES),
        offer: rand.pick(OFFERS),
        cta: rand.pick(CTAS),
        landingPageUrl: product.url,
        productExternalId: product.externalId,
        firstSeenAt: firstSeen.toISOString(),
        lastSeenAt: lastSeen.toISOString(),
        active,
        creatives,
      });
    }

    return ads;
  }

  async searchAds(query: string): Promise<ProviderAd[]> {
    const rand = new SeededRandom(`search:${query}`);
    const count = rand.int(3, 10);
    return Array.from({ length: count }, (_, i) => {
      const firstSeen = rand.daysAgo(rand.int(3, 200));
      const active = rand.bool(0.6);
      return {
        externalId: `search-${query}-${i}`,
        platform: rand.pick(PLATFORMS),
        angle: rand.pick(AD_ANGLES),
        offer: rand.pick(OFFERS),
        cta: rand.pick(CTAS),
        landingPageUrl: `https://example.com/products/${query}`,
        productExternalId: null,
        firstSeenAt: firstSeen.toISOString(),
        lastSeenAt: active ? new Date().toISOString() : rand.daysAgo(rand.int(0, 20)).toISOString(),
        active,
        creatives: [buildCreative(rand, `search-${query}-${i}-creative`)],
      };
    });
  }
}
