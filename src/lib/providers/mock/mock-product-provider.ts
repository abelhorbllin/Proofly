import { SeededRandom } from "@/lib/mock/random";
import { NICHES, PRODUCT_TEMPLATES } from "@/lib/mock/catalog";
import type { ProviderProduct, ProductDataProvider } from "@/lib/providers/types";

export class MockProductDataProvider implements ProductDataProvider {
  async getStoreProducts(domain: string): Promise<ProviderProduct[]> {
    const rand = new SeededRandom(`${domain}:products`);
    const niche = rand.pick(NICHES);
    const templates = PRODUCT_TEMPLATES[niche];
    const count = rand.int(4, Math.min(8, templates.length));
    const names = rand.pickMany(templates, count);

    return names.map((name, idx) => {
      const price = rand.float(14.99, 89.99, 2);
      const hasCompare = rand.bool(0.6);
      const firstObserved = rand.daysAgo(rand.int(30, 300));
      return {
        externalId: `${domain}-product-${idx}`,
        name,
        url: `https://${domain}/products/${name.toLowerCase().replace(/\s+/g, "-")}`,
        price,
        compareAtPrice: hasCompare ? Number((price * rand.float(1.3, 1.9, 2)).toFixed(2)) : null,
        currency: "EUR",
        images: [`https://picsum.photos/seed/${domain}-${idx}/600/600`],
        description: `${name} — one of the most consistently promoted items observed on this store across the tracked period.`,
        firstObservedAt: firstObserved.toISOString(),
        lastObservedAt: new Date().toISOString(),
      };
    });
  }
}
