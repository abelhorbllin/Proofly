import { z } from "zod";

export const AdAnalysisSchema = z.object({
  summary: z.string(),
  hookAnalysis: z.string(),
  visualAnalysis: z.string(),
  offerAnalysis: z.string(),
  ctaAnalysis: z.string(),
  audienceHypothesis: z.string(),
  angleClassification: z.enum([
    "PROBLEM_SOLUTION",
    "BEFORE_AFTER",
    "DEMONSTRATION",
    "UGC",
    "TESTIMONIAL",
    "LIFESTYLE",
    "CURIOSITY",
    "FOMO",
    "DISCOUNT",
    "SOCIAL_PROOF",
    "EDUCATIONAL",
    "EMOTIONAL",
  ]),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  objections: z.array(z.string()),
  improvements: z.array(z.string()),
  testingIdeas: z.array(z.string()),
  confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
});
export type AdAnalysisResult = z.infer<typeof AdAnalysisSchema>;

export const ValidationAssessmentSchema = z.object({
  summary: z.string(),
  signals: z.array(
    z.object({
      label: z.string(),
      value: z.enum(["WEAK", "MEDIUM", "STRONG"]),
      explanation: z.string(),
    })
  ),
  risks: z.array(z.string()),
  questionsToInvestigate: z.array(z.string()),
  opportunities: z.array(z.string()),
  confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
});
export type ValidationAssessment = z.infer<typeof ValidationAssessmentSchema>;

export const StoreAuditSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendations: z.array(z.string()),
  priorityActions: z.array(z.string()),
  confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
});
export type StoreAudit = z.infer<typeof StoreAuditSchema>;

export const StrategySchema = z.object({
  summary: z.string(),
  observedPositioning: z.array(z.string()),
  commonAngles: z.array(z.string()),
  commonOffers: z.array(z.string()),
  priceRangeObservation: z.string(),
  differentiationOpportunities: z.array(z.string()),
  weaknessesObserved: z.array(z.string()),
  questionsToInvestigate: z.array(z.string()),
  confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
});
export type Strategy = z.infer<typeof StrategySchema>;

export const ComparisonSchema = z.object({
  summary: z.string(),
  differences: z.array(z.string()),
  confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
});
export type Comparison = z.infer<typeof ComparisonSchema>;
