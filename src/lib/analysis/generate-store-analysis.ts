import { db } from "@/lib/db";
import {
  getAdDataProvider,
  getProductDataProvider,
  getRevenueDataProvider,
  getStoreDataProvider,
  getTrafficDataProvider,
} from "@/lib/providers";
import type { Prisma } from "@prisma/client";

export interface AnalysisProgressStep {
  key: string;
  label: string;
}

export const STORE_ANALYSIS_STEPS: AnalysisProgressStep[] = [
  { key: "store", label: "Store detected" },
  { key: "products", label: "Products analyzed" },
  { key: "ads", label: "Ads analyzed" },
  { key: "traffic", label: "Traffic estimated" },
  { key: "revenue", label: "Revenue estimated" },
];

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

/**
 * Orchestrates the full store analysis job: validates the URL, pulls data
 * from every provider, persists everything, and returns the created store
 * id. Mirrors the job flow in spec section 48. Providers are resolved
 * through the factory in src/lib/providers so swapping mock -> live data
 * sources never touches this function.
 */
export async function generateStoreAnalysis(organizationId: string, rawUrl: string) {
  const url = normalizeUrl(rawUrl);

  const storeProvider = getStoreDataProvider();
  const productProvider = getProductDataProvider();
  const adProvider = getAdDataProvider();
  const trafficProvider = getTrafficDataProvider();
  const revenueProvider = getRevenueDataProvider();

  const storeData = await storeProvider.analyzeStore(url);

  let store = await db.store.findFirst({
    where: { organizationId, domain: storeData.domain },
  });

  if (!store) {
    store = await db.store.create({
      data: {
        organizationId,
        domain: storeData.domain,
        name: storeData.name,
        platform: storeData.platform,
        country: storeData.country,
        category: storeData.category,
        currency: storeData.currency,
        status: "PROCESSING",
        firstObservedAt: new Date(storeData.firstObservedAt),
        lastObservedAt: new Date(storeData.lastObservedAt),
      },
    });

    await db.timelineEvent.create({
      data: {
        storeId: store.id,
        type: "STORE_DETECTED",
        title: "Store first analyzed",
        description: `${storeData.name} was first detected and added to your workspace.`,
        occurredAt: new Date(),
      },
    });
  } else {
    store = await db.store.update({
      where: { id: store.id },
      data: { status: "PROCESSING", lastObservedAt: new Date() },
    });
  }

  const products = await productProvider.getStoreProducts(storeData.domain);
  const productIdByExternal = new Map<string, string>();

  for (const p of products) {
    const existing = await db.product.findFirst({ where: { storeId: store.id, name: p.name } });
    const record = existing
      ? await db.product.update({
          where: { id: existing.id },
          data: {
            price: p.price,
            compareAtPrice: p.compareAtPrice,
            lastObservedAt: new Date(p.lastObservedAt),
          },
        })
      : await db.product.create({
          data: {
            storeId: store.id,
            name: p.name,
            url: p.url,
            price: p.price,
            compareAtPrice: p.compareAtPrice,
            currency: p.currency,
            images: p.images,
            description: p.description,
            firstObservedAt: new Date(p.firstObservedAt),
            lastObservedAt: new Date(p.lastObservedAt),
          },
        });
    productIdByExternal.set(p.externalId, record.id);

    if (!existing) {
      await db.timelineEvent.create({
        data: {
          storeId: store.id,
          productId: record.id,
          type: "NEW_PRODUCT",
          title: "New product detected",
          description: `${p.name} was newly observed on ${storeData.name}.`,
          occurredAt: new Date(p.firstObservedAt),
        },
      });
    }
  }

  const providerAds = await adProvider.getStoreAds(storeData.domain, products);

  for (const ad of providerAds) {
    const productId = ad.productExternalId ? productIdByExternal.get(ad.productExternalId) : undefined;

    const existingAd = await db.ad.findFirst({
      where: { storeId: store.id, landingPageUrl: ad.landingPageUrl, platform: ad.platform, offer: ad.offer },
    });

    const adRecord = existingAd
      ? await db.ad.update({
          where: { id: existingAd.id },
          data: { status: ad.active ? "ACTIVE" : "INACTIVE", lastSeenAt: new Date(ad.lastSeenAt) },
        })
      : await db.ad.create({
          data: {
            storeId: store.id,
            productId: productId ?? null,
            platform: ad.platform,
            status: ad.active ? "ACTIVE" : "INACTIVE",
            angle: ad.angle,
            offer: ad.offer,
            cta: ad.cta,
            landingPageUrl: ad.landingPageUrl,
            firstSeenAt: new Date(ad.firstSeenAt),
            lastSeenAt: new Date(ad.lastSeenAt),
            source: "Mock Ad Provider",
            confidence: "MEDIUM",
            methodology: "Observed via supported public ad library sources (mock data in this environment).",
          },
        });

    if (!existingAd) {
      for (const creative of ad.creatives) {
        await db.adCreative.create({
          data: {
            adId: adRecord.id,
            format: creative.format,
            mediaUrl: creative.mediaUrl,
            thumbnailUrl: creative.thumbnailUrl,
            hook: creative.hook,
            headline: creative.headline,
            primaryText: creative.primaryText,
            firstSeenAt: new Date(creative.firstSeenAt),
            lastSeenAt: new Date(creative.lastSeenAt),
            status: creative.active ? "ACTIVE" : "INACTIVE",
          },
        });
      }

      await db.timelineEvent.create({
        data: {
          storeId: store.id,
          productId: productId ?? null,
          adId: adRecord.id,
          type: "NEW_AD",
          title: "New ad detected",
          description: `A new ${ad.platform} ad was detected for ${storeData.name}.`,
          occurredAt: new Date(ad.firstSeenAt),
        },
      });
    }
  }

  const traffic = await trafficProvider.getTraffic(storeData.domain);
  await db.trafficEstimate.create({
    data: {
      storeId: store.id,
      monthlyVisitsLow: traffic.monthlyVisits.low ?? traffic.monthlyVisits.value,
      monthlyVisitsHigh: traffic.monthlyVisits.high ?? traffic.monthlyVisits.value,
      trend: traffic.trend as unknown as Prisma.InputJsonValue,
      sources: traffic.sources as unknown as Prisma.InputJsonValue,
      countries: traffic.countries as unknown as Prisma.InputJsonValue,
      devices: traffic.devices as unknown as Prisma.InputJsonValue,
      confidence: traffic.monthlyVisits.confidence,
      source: traffic.monthlyVisits.source,
      observedAt: new Date(traffic.monthlyVisits.observedAt),
      methodology: traffic.monthlyVisits.methodology,
    },
  });

  const revenue = await revenueProvider.getRevenue(storeData.domain, traffic, products);
  await db.revenueEstimate.create({
    data: {
      storeId: store.id,
      dailyLow: revenue.dailyRevenue.low ?? revenue.dailyRevenue.value,
      dailyHigh: revenue.dailyRevenue.high ?? revenue.dailyRevenue.value,
      monthlyLow: revenue.monthlyRevenue.low ?? revenue.monthlyRevenue.value,
      monthlyHigh: revenue.monthlyRevenue.high ?? revenue.monthlyRevenue.value,
      annualLow: revenue.annualRevenue.low ?? revenue.annualRevenue.value,
      annualHigh: revenue.annualRevenue.high ?? revenue.annualRevenue.value,
      aovLow: revenue.aov.low ?? revenue.aov.value,
      aovHigh: revenue.aov.high ?? revenue.aov.value,
      conversionLow: revenue.conversionRate.low ?? revenue.conversionRate.value,
      conversionHigh: revenue.conversionRate.high ?? revenue.conversionRate.value,
      adSpendMonthlyLow: revenue.monthlyAdSpend.low ?? null,
      adSpendMonthlyHigh: revenue.monthlyAdSpend.high ?? null,
      confidence: revenue.monthlyRevenue.confidence,
      source: revenue.monthlyRevenue.source,
      observedAt: new Date(revenue.monthlyRevenue.observedAt),
      methodology: revenue.monthlyRevenue.methodology,
    },
  });

  store = await db.store.update({
    where: { id: store.id },
    data: { status: "COMPLETED", lastObservedAt: new Date() },
  });

  return store;
}
