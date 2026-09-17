import { SeededRandom } from "@/lib/mock/random";
import { COUNTRIES } from "@/lib/mock/catalog";
import type { ProviderTrafficData, TrafficDataProvider } from "@/lib/providers/types";

export class MockTrafficDataProvider implements TrafficDataProvider {
  async getTraffic(domain: string): Promise<ProviderTrafficData> {
    const rand = new SeededRandom(`${domain}:traffic`);
    const base = rand.int(15000, 450000);
    const low = Math.round(base * 0.8);
    const high = Math.round(base * 1.25);

    const trend = Array.from({ length: 12 }, (_, i) => {
      const monthsAgo = 11 - i;
      const date = new Date();
      date.setMonth(date.getMonth() - monthsAgo);
      const noise = rand.float(0.7, 1.3, 2);
      const growth = 1 + (i / 11) * rand.float(-0.2, 0.6, 2);
      return {
        date: date.toISOString().slice(0, 7),
        visits: Math.round(base * noise * growth * 0.3),
      };
    });

    const organic = rand.int(20, 45);
    const paid = rand.int(20, 45);
    const social = rand.int(10, 30);
    const direct = rand.int(5, 15);
    const remainder = Math.max(0, 100 - organic - paid - social - direct);

    const countryPool = rand.pickMany(COUNTRIES, 4);
    let remaining = 100;
    const countries = countryPool.map((country, idx) => {
      const isLast = idx === countryPool.length - 1;
      const share = isLast ? remaining : rand.int(10, Math.max(15, Math.floor(remaining / 2)));
      remaining -= share;
      return { country, share };
    });

    return {
      monthlyVisits: {
        value: base,
        low,
        high,
        confidence: base > 200000 ? "MEDIUM" : "LOW",
        source: "Mock Traffic Provider",
        observedAt: new Date().toISOString(),
        methodology:
          "Estimated from modeled category benchmarks and observed ad activity intensity. No direct analytics access.",
      },
      trend,
      sources: { organic, paid, social, direct, referral: remainder },
      countries,
      devices: { desktop: rand.int(25, 40), mobile: rand.int(50, 65), tablet: rand.int(5, 12) },
    };
  }
}
