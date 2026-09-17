import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateStoreAnalysis } from "../src/lib/analysis/generate-store-analysis";

const db = new PrismaClient();

const DEMO_DOMAINS = [
  "lumoglow.example.com",
  "verveactive.example.com",
  "aurahome.example.com",
  "kindrapets.example.com",
  "blumebeauty.example.com",
];

async function main() {
  console.log("Seeding ADINTEL demo data...");

  const passwordHash = await bcrypt.hash("demo1234", 10);

  const organization = await db.organization.upsert({
    where: { id: "demo-org" },
    update: {},
    create: {
      id: "demo-org",
      name: "Demo Workspace",
    },
  });

  await db.subscription.upsert({
    where: { organizationId: organization.id },
    update: {},
    create: {
      organizationId: organization.id,
      plan: "PRO",
      status: "ACTIVE",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await db.user.upsert({
    where: { email: "demo@adintel.app" },
    update: {},
    create: {
      email: "demo@adintel.app",
      passwordHash,
      name: "Demo User",
      organizationId: organization.id,
      onboardingComplete: true,
      businessType: "DROPSHIPPING",
      mainMarket: "EUROPE",
      mainGoal: "VALIDATE_PRODUCTS",
    },
  });

  const period = new Date().toISOString().slice(0, 7);
  await db.usage.upsert({
    where: { organizationId_period: { organizationId: organization.id, period } },
    update: {},
    create: {
      organizationId: organization.id,
      period,
      storeAnalyses: 5,
      productValidations: 2,
      aiAnalyses: 12,
      competitorsTracked: 3,
      reportsGenerated: 1,
    },
  });

  console.log("Generating demo stores, products, ads, traffic and revenue estimates...");
  const stores = [];
  for (const domain of DEMO_DOMAINS) {
    const store = await generateStoreAnalysis(organization.id, domain);
    stores.push(store);
    console.log(`  -> analyzed ${store.domain}`);
  }

  console.log("Tracking competitors...");
  for (const store of stores.slice(0, 3)) {
    const competitor = await db.competitor.upsert({
      where: { storeId: store.id },
      update: {},
      create: {
        organizationId: organization.id,
        storeId: store.id,
        name: store.name,
        domain: store.domain,
        category: store.category,
        tracked: true,
      },
    });

    await db.tracking.upsert({
      where: { competitorId: competitor.id },
      update: {},
      create: { competitorId: competitor.id },
    });

    await db.alert.create({
      data: {
        organizationId: organization.id,
        competitorId: competitor.id,
        type: "NEW_AD",
        title: "New competitor ad detected",
        body: `${store.name} launched a new ad campaign observed on tracked platforms.`,
        entityType: "STORE",
        entityId: store.id,
        read: false,
      },
    });
  }

  await db.alert.createMany({
    data: [
      {
        organizationId: organization.id,
        type: "PRICE_CHANGE",
        title: "Price change detected",
        body: `${stores[1]?.name ?? "A tracked store"} changed a product price.`,
        read: false,
      },
      {
        organizationId: organization.id,
        type: "TRAFFIC_CHANGE",
        title: "Traffic estimate updated",
        body: `Estimated traffic shifted meaningfully for ${stores[2]?.name ?? "a tracked store"}.`,
        read: true,
      },
    ],
  });

  console.log("Generating AI insight...");
  await db.aIInsight.create({
    data: {
      organizationId: organization.id,
      type: "STRATEGY",
      content: {
        summary: "Across tracked competitors, discount-based offers and demonstration-style video creatives are the most frequently observed advertising patterns.",
        observedPositioning: stores.map((s) => `${s.name} appears active in paid advertising based on tracked ad volume.`),
        commonAngles: ["DEMONSTRATION", "DISCOUNT", "SOCIAL_PROOF"],
        commonOffers: ["Discount-based offers were observed most frequently"],
        priceRangeObservation: "Observed prices range broadly across tracked stores.",
        differentiationOpportunities: ["An educational angle appears underused among tracked competitors."],
        weaknessesObserved: ["Limited creative diversity observed among some tracked competitors."],
        questionsToInvestigate: ["Which angle has sustained the longest active run time?"],
        confidence: "MEDIUM",
      },
      confidence: "MEDIUM",
      model: "mock-ai",
    },
  });

  console.log("Generating a sample report...");
  const demoUser = await db.user.findUniqueOrThrow({ where: { email: "demo@adintel.app" } });
  await db.report.create({
    data: {
      organizationId: organization.id,
      userId: demoUser.id,
      type: "STORE_ANALYSIS",
      title: `Store Analysis — ${stores[0]?.name ?? "Demo Store"}`,
      targetEntityType: "STORE",
      targetEntityId: stores[0]?.id,
      content: { note: "Demo report generated during seeding." },
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
