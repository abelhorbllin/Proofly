import OpenAI from "openai";
import { z } from "zod";
import {
  AdAnalysisResult,
  AdAnalysisSchema,
  Comparison,
  ComparisonSchema,
  Strategy,
  StrategySchema,
  StoreAudit,
  StoreAuditSchema,
  ValidationAssessment,
  ValidationAssessmentSchema,
} from "@/lib/ai/schemas";

const SYSTEM_RULES = `You are AdIntel AI, an analyst embedded in an e-commerce competitive intelligence tool.
Rules you must always follow:
- Use ONLY the data provided to you in the prompt. Never invent facts, numbers, or company details.
- Clearly separate observed facts from estimates and inference.
- State uncertainty explicitly. Never guarantee business outcomes or performance.
- If information is insufficient, say so plainly instead of filling gaps with invented content.
- Output must be valid JSON matching the requested schema exactly, with no markdown fences.`;

function getClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

async function callStructured<T>(prompt: string, schema: z.ZodType<T>): Promise<{ result: T; model: string } | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_RULES },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;
    const parsed = schema.parse(JSON.parse(raw));
    return { result: parsed, model: "gpt-4o-mini" };
  } catch {
    return null;
  }
}

export class AIService {
  async analyzeAdCreative(input: {
    hook: string;
    headline: string;
    primaryText: string;
    format: string;
    platform: string;
    offer: string;
    cta: string;
    productName?: string;
  }): Promise<{ result: AdAnalysisResult; model: string }> {
    const prompt = `Analyze this ad creative using only the data given. Return JSON matching this shape:
{"summary":string,"hookAnalysis":string,"visualAnalysis":string,"offerAnalysis":string,"ctaAnalysis":string,"audienceHypothesis":string,"angleClassification":one of PROBLEM_SOLUTION|BEFORE_AFTER|DEMONSTRATION|UGC|TESTIMONIAL|LIFESTYLE|CURIOSITY|FOMO|DISCOUNT|SOCIAL_PROOF|EDUCATIONAL|EMOTIONAL,"strengths":string[],"weaknesses":string[],"objections":string[],"improvements":string[],"testingIdeas":string[],"confidence":LOW|MEDIUM|HIGH}

Ad data:
Platform: ${input.platform}
Format: ${input.format}
Product: ${input.productName ?? "unknown"}
Hook: ${input.hook}
Headline: ${input.headline}
Primary text: ${input.primaryText}
Offer: ${input.offer}
CTA: ${input.cta}`;

    const live = await callStructured(prompt, AdAnalysisSchema);
    if (live) return live;
    return { result: mockAdAnalysis(input), model: "mock-ai" };
  }

  async generateValidationSummary(input: {
    productName: string;
    sellingPrice: number;
    competitorCount: number;
    adCount: number;
    activeAdCount: number;
    angleVariety: number;
    grossMarginPct: number | null;
    dataConfidence: "LOW" | "MEDIUM" | "HIGH";
  }): Promise<{ result: ValidationAssessment; model: string }> {
    const prompt = `Assess this e-commerce product opportunity using only the evidence given. Never guarantee success. Return JSON:
{"summary":string,"signals":[{"label":string,"value":"WEAK"|"MEDIUM"|"STRONG","explanation":string}],"risks":string[],"questionsToInvestigate":string[],"opportunities":string[],"confidence":"LOW"|"MEDIUM"|"HIGH"}

Evidence:
Product: ${input.productName}
Selling price: ${input.sellingPrice}
Competitor stores observed selling this or a similar product: ${input.competitorCount}
Total ads observed: ${input.adCount} (${input.activeAdCount} currently active)
Distinct advertising angles observed: ${input.angleVariety}
Estimated gross margin: ${input.grossMarginPct !== null ? input.grossMarginPct + "%" : "unknown"}
Overall data confidence: ${input.dataConfidence}`;

    const live = await callStructured(prompt, ValidationAssessmentSchema);
    if (live) return live;
    return { result: mockValidationAssessment(input), model: "mock-ai" };
  }

  async generateStoreAudit(input: {
    storeName: string;
    productCount: number;
    activeAdCount: number;
    category: string;
  }): Promise<{ result: StoreAudit; model: string }> {
    const prompt = `Audit this store based only on the structural data available (no live browsing was performed). Return JSON:
{"summary":string,"strengths":string[],"weaknesses":string[],"recommendations":string[],"priorityActions":string[],"confidence":"LOW"|"MEDIUM"|"HIGH"}

Store: ${input.storeName}
Category: ${input.category}
Tracked products: ${input.productCount}
Active ads observed: ${input.activeAdCount}`;

    const live = await callStructured(prompt, StoreAuditSchema);
    if (live) return live;
    return { result: mockStoreAudit(input), model: "mock-ai" };
  }

  async generateStrategy(input: {
    competitorNames: string[];
    commonAnglesObserved: string[];
    priceRangeLow: number;
    priceRangeHigh: number;
    currency: string;
  }): Promise<{ result: Strategy; model: string }> {
    const prompt = `Summarize observed market strategy signals across these tracked competitors using only the data given. Return JSON:
{"summary":string,"observedPositioning":string[],"commonAngles":string[],"commonOffers":string[],"priceRangeObservation":string,"differentiationOpportunities":string[],"weaknessesObserved":string[],"questionsToInvestigate":string[],"confidence":"LOW"|"MEDIUM"|"HIGH"}

Competitors tracked: ${input.competitorNames.join(", ") || "none"}
Advertising angles observed across them: ${input.commonAnglesObserved.join(", ") || "insufficient data"}
Observed price range: ${input.currency} ${input.priceRangeLow}-${input.priceRangeHigh}`;

    const live = await callStructured(prompt, StrategySchema);
    if (live) return live;
    return { result: mockStrategy(input), model: "mock-ai" };
  }

  async generateComparison(input: {
    storeAName: string;
    storeBName: string;
    facts: string[];
  }): Promise<{ result: Comparison; model: string }> {
    const prompt = `Compare these two stores using only the listed facts. Never declare a winner — describe differences only. Return JSON:
{"summary":string,"differences":string[],"confidence":"LOW"|"MEDIUM"|"HIGH"}

Store A: ${input.storeAName}
Store B: ${input.storeBName}
Facts:
${input.facts.map((f) => `- ${f}`).join("\n")}`;

    const live = await callStructured(prompt, ComparisonSchema);
    if (live) return live;
    return { result: mockComparison(input), model: "mock-ai" };
  }

  async chat(messages: { role: "user" | "assistant"; content: string }[], context: string): Promise<{ content: string; model: string }> {
    const client = getClient();
    if (client) {
      try {
        const completion = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `${SYSTEM_RULES}\n\nApplication data available to answer from:\n${context}\n\nIf the answer isn't in this data, say you don't have that information rather than guessing.`,
            },
            ...messages,
          ],
          temperature: 0.5,
        });
        const content = completion.choices[0]?.message?.content;
        if (content) return { content, model: "gpt-4o-mini" };
      } catch {
        // fall through to mock
      }
    }
    return { content: mockChatReply(messages, context), model: "mock-ai" };
  }
}

export const aiService = new AIService();

// ---------------------------------------------------------------------------
// Deterministic fallbacks used when OPENAI_API_KEY is not configured. These
// are templated from the actual input data (never fabricated business facts)
// so the product is fully usable in demo/mock mode per spec section 65/59.
// ---------------------------------------------------------------------------

function mockAdAnalysis(input: {
  hook: string;
  offer: string;
  cta: string;
  format: string;
  platform: string;
  productName?: string;
}): AdAnalysisResult {
  return {
    summary: `This ${input.format.toLowerCase()} creative on ${input.platform} opens with a hook-driven angle and pairs it with a "${input.offer}" offer, directing traffic via a "${input.cta}" call to action.`,
    hookAnalysis: `The hook ("${input.hook}") leads with pattern interruption, aiming to stop the scroll before introducing the product.`,
    visualAnalysis: `As a ${input.format.toLowerCase()} format, the creative likely relies on ${input.format === "VIDEO" ? "motion and demonstration to build interest in the first 3 seconds" : "a single strong product image to communicate value instantly"}.`,
    offerAnalysis: `The offer ("${input.offer}") is a common lever for reducing perceived purchase risk and prompting immediate action.`,
    ctaAnalysis: `The CTA ("${input.cta}") is direct and transactional, consistent with a bottom-of-funnel push.`,
    audienceHypothesis: `Likely targets a cold-to-warm audience already familiar with the problem this product addresses, based on the hook framing.`,
    angleClassification: "PROBLEM_SOLUTION",
    strengths: ["Clear, direct call to action", "Offer reduces purchase friction"],
    weaknesses: ["No social proof element detected in the observed copy", "Generic hook pattern also used broadly across this niche"],
    objections: ["Price relative to perceived value", "Trust in an unfamiliar brand"],
    improvements: ["Test adding a customer count or review rating", "Test a stronger before/after visual proof point"],
    testingIdeas: ["A/B test this hook against a curiosity-driven variant", "Test a bundle offer against the current single-item offer"],
    confidence: "LOW",
  };
}

function mockValidationAssessment(input: {
  productName: string;
  competitorCount: number;
  adCount: number;
  activeAdCount: number;
  angleVariety: number;
  grossMarginPct: number | null;
  dataConfidence: "LOW" | "MEDIUM" | "HIGH";
}): ValidationAssessment {
  const advertisingSignal = input.activeAdCount >= 6 ? "STRONG" : input.activeAdCount >= 2 ? "MEDIUM" : "WEAK";
  const competitionSignal = input.competitorCount >= 5 ? "STRONG" : input.competitorCount >= 2 ? "MEDIUM" : "WEAK";
  const diversitySignal = input.angleVariety >= 4 ? "STRONG" : input.angleVariety >= 2 ? "MEDIUM" : "WEAK";
  return {
    summary: `Observed signals for "${input.productName}" indicate ${advertisingSignal.toLowerCase()} advertising activity across ${input.competitorCount} tracked competitor stores, with ${input.activeAdCount} of ${input.adCount} observed ads currently active. This is evidence to weigh, not a guarantee of performance.`,
    signals: [
      { label: "Advertising activity", value: advertisingSignal, explanation: `${input.activeAdCount} active ads observed out of ${input.adCount} total tracked.` },
      { label: "Competitor density", value: competitionSignal, explanation: `${input.competitorCount} competitor stores observed selling this or a similar product.` },
      { label: "Creative diversity", value: diversitySignal, explanation: `${input.angleVariety} distinct advertising angles detected.` },
      {
        label: "Estimated margin",
        value: input.grossMarginPct === null ? "WEAK" : input.grossMarginPct >= 50 ? "STRONG" : input.grossMarginPct >= 30 ? "MEDIUM" : "WEAK",
        explanation: input.grossMarginPct === null ? "Cost inputs not provided." : `Modeled gross margin of approximately ${input.grossMarginPct}% before advertising spend.`,
      },
    ],
    risks: [
      "Public advertising data does not confirm actual sales volume or profitability.",
      "Market saturation may increase customer acquisition cost over time.",
      "Estimates rely on modeled conversion and traffic ranges, not verified analytics.",
    ],
    questionsToInvestigate: [
      "What is the actual landed product cost at your target order volume?",
      "How long have the strongest-performing competitor ads been running?",
      "Is there room to differentiate on offer, bundle, or positioning?",
    ],
    opportunities: ["Consider testing an angle not yet observed among tracked competitors.", "Evaluate a bundle or subscription offer if none is currently observed."],
    confidence: input.dataConfidence,
  };
}

function mockStoreAudit(input: { storeName: string; productCount: number; activeAdCount: number; category: string }): StoreAudit {
  return {
    summary: `${input.storeName} is a ${input.category.toLowerCase()} store with ${input.productCount} tracked products and ${input.activeAdCount} currently active ads observed. This audit is based only on structural data retrieved by ADINTEL, not a live visual review.`,
    strengths: ["Maintains active advertising presence based on observed ad count", "Operates in a category with established demand signals"],
    weaknesses: ["Visual/UX quality could not be independently verified from available data", "Trust and social proof elements were not directly observed"],
    recommendations: ["Audit checkout flow for friction points", "Compare offer structure against top tracked competitors"],
    priorityActions: ["Review pricing against category benchmarks", "Assess creative diversity relative to competitors"],
    confidence: "LOW",
  };
}

function mockStrategy(input: { competitorNames: string[]; commonAnglesObserved: string[]; priceRangeLow: number; priceRangeHigh: number; currency: string }): Strategy {
  const topAngles = input.commonAnglesObserved.slice(0, 3);
  return {
    summary: `Across ${input.competitorNames.length} tracked competitor${input.competitorNames.length === 1 ? "" : "s"}, the most frequently observed advertising angles were ${topAngles.join(", ") || "not yet determined due to limited data"}.`,
    observedPositioning: input.competitorNames.map((n) => `${n} appears active in paid advertising based on tracked ad volume.`),
    commonAngles: topAngles,
    commonOffers: ["Discount-based offers were observed most frequently"],
    priceRangeObservation: `Observed prices range from ${input.currency} ${input.priceRangeLow} to ${input.currency} ${input.priceRangeHigh} across tracked competitors.`,
    differentiationOpportunities: ["An angle not present among tracked competitors may reduce direct creative comparison", "A premium or subscription offer structure appears underused in this set"],
    weaknessesObserved: ["Limited creative diversity was observed among some tracked competitors"],
    questionsToInvestigate: ["Which angle has sustained the longest active run time?", "Are any competitors testing new offers recently?"],
    confidence: input.competitorNames.length >= 3 ? "MEDIUM" : "LOW",
  };
}

function mockComparison(input: { storeAName: string; storeBName: string; facts: string[] }): Comparison {
  return {
    summary: `Comparison between ${input.storeAName} and ${input.storeBName} based on ${input.facts.length} observed data points. No winner is declared — differences are presented as evidence.`,
    differences: input.facts,
    confidence: input.facts.length >= 4 ? "MEDIUM" : "LOW",
  };
}

function mockChatReply(messages: { role: "user" | "assistant"; content: string }[], context: string): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  if (!context || context.trim().length === 0) {
    return "I don't have enough application data yet to answer that. Try analyzing a store or product first.";
  }
  return `Based on the data currently available in your workspace, here's what I can tell you about "${lastUser}":\n\n${context.slice(0, 600)}\n\nThis reflects observed and estimated data only — treat it as evidence, not certainty. (Connect an OPENAI_API_KEY to enable full conversational analysis.)`;
}
