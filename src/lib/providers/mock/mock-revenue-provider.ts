import { SeededRandom } from "@/lib/mock/random";
import type {
  ProviderProduct,
  ProviderRevenueData,
  ProviderTrafficData,
  RevenueDataProvider,
} from "@/lib/providers/types";

// Revenue is never invented directly — it is always derived from traffic x
// conversion x AOV, mirroring the transparent methodology required in
// spec section 70 (Revenue Calculations) and section 72 (Transparency UX).
export class MockRevenueDataProvider implements RevenueDataProvider {
  async getRevenue(
    domain: string,
    traffic: ProviderTrafficData,
    products: ProviderProduct[]
  ): Promise<ProviderRevenueData> {
    const rand = new SeededRandom(`${domain}:revenue`);

    const prices = products.length > 0 ? products.map((p) => p.price) : [39.99];
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const aovLow = Number((avgPrice * 1.1).toFixed(2));
    const aovHigh = Number((avgPrice * 1.6).toFixed(2));

    const convLow = rand.float(1.0, 1.8, 2);
    const convHigh = rand.float(convLow + 0.4, convLow + 1.2, 2);

    const visitsLow = traffic.monthlyVisits.low ?? traffic.monthlyVisits.value * 0.8;
    const visitsHigh = traffic.monthlyVisits.high ?? traffic.monthlyVisits.value * 1.25;

    const monthlyLow = Math.round((visitsLow * (convLow / 100) * aovLow) / 100) * 100;
    const monthlyHigh = Math.round((visitsHigh * (convHigh / 100) * aovHigh) / 100) * 100;

    const dailyLow = Math.round(monthlyLow / 30);
    const dailyHigh = Math.round(monthlyHigh / 30);
    const annualLow = monthlyLow * 12;
    const annualHigh = monthlyHigh * 12;

    // Ad spend modeled as a share of estimated revenue, typical for paid-heavy DTC stores.
    const spendShareLow = rand.float(0.12, 0.2, 2);
    const spendShareHigh = rand.float(0.22, 0.32, 2);

    const confidence = traffic.monthlyVisits.confidence;
    const observedAt = new Date().toISOString();
    const source = "Modeled: traffic x conversion x AOV";

    return {
      dailyRevenue: {
        value: Math.round((dailyLow + dailyHigh) / 2),
        low: dailyLow,
        high: dailyHigh,
        confidence,
        source,
        observedAt,
        methodology: "Daily revenue = (monthly traffic range / 30) x modeled conversion rate x AOV range.",
      },
      monthlyRevenue: {
        value: Math.round((monthlyLow + monthlyHigh) / 2),
        low: monthlyLow,
        high: monthlyHigh,
        confidence,
        source,
        observedAt,
        methodology: "Monthly revenue = estimated monthly traffic range x modeled conversion range x observed AOV range.",
      },
      annualRevenue: {
        value: Math.round((annualLow + annualHigh) / 2),
        low: annualLow,
        high: annualHigh,
        confidence,
        source,
        observedAt,
        methodology: "Annualized from the monthly revenue range x 12. Does not account for seasonality.",
      },
      aov: {
        value: Number(((aovLow + aovHigh) / 2).toFixed(2)),
        low: aovLow,
        high: aovHigh,
        confidence: "MEDIUM",
        source: "Observed product pricing",
        observedAt,
        methodology: "Derived from the price range of products observed for sale on this store.",
      },
      conversionRate: {
        value: Number(((convLow + convHigh) / 2).toFixed(2)),
        low: convLow,
        high: convHigh,
        confidence: "LOW",
        source: "Category benchmark model",
        observedAt,
        methodology: "Modeled using typical e-commerce conversion ranges for the store's category; not directly observed.",
      },
      monthlyAdSpend: {
        value: Math.round((monthlyLow * spendShareLow + monthlyHigh * spendShareHigh) / 2),
        low: Math.round(monthlyLow * spendShareLow),
        high: Math.round(monthlyHigh * spendShareHigh),
        confidence: "LOW",
        source: "Modeled from estimated revenue and observed ad activity",
        observedAt,
        methodology: "Estimated as a share of modeled revenue, calibrated against observed ad creative volume.",
      },
    };
  }
}
