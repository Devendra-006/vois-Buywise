import { z } from "zod";

export const SearchWeightsSchema = z.object({
  price: z.number().min(0).max(1).optional(),
  reviews: z.number().min(0).max(1).optional(),
  rating: z.number().min(0).max(1).optional(),
  delivery: z.number().min(0).max(1).optional()
}).refine(
  (weights) => {
    const sum = Object.values(weights).reduce((acc, val) => acc + (val || 0), 0);
    // If weights are provided, they shouldn't all be 0
    return sum === 0 || Math.abs(sum - 1.0) < 0.05 || sum > 0;
  },
  { message: "Weights must be positive numbers" }
);

export const SearchRequestSchema = z.object({
  query: z.string().min(2, "Search query must be at least 2 characters").max(200, "Search query is too long"),
  weights: SearchWeightsSchema.optional(),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be a 6-digit Indian PIN code").optional().nullable(),
  targetLang: z.enum(["en", "hi", "ta", "te", "bn", "mr", "gu", "kn", "ml"]).default("en"),
  forceRefresh: z.boolean().optional()
});

export const ParsedQuerySchema = z.object({
  category: z.enum(["earbuds", "smartphones", "laptops", "general"]),
  cleanedQuery: z.string(),
  maxPrice: z.number().nullable().default(null),
  minPrice: z.number().nullable().default(null),
  mustHave: z.array(z.string()).default([]),
  niceToHave: z.array(z.string()).default([]),
  targetLanguage: z.string().default("en")
});

export const ReviewSummaryLLMSchema = z.object({
  pros: z.array(z.string()).min(1).max(5),
  cons: z.array(z.string()).min(1).max(5),
  sentiment: z.enum(["positive", "mixed", "neutral"]),
  basedOnReviews: z.number().int().min(0),
  confidence: z.enum(["high", "medium", "low"]),
  sourceQuotes: z.array(z.string()).max(3).optional()
});

export const DecisionExplanationLLMSchema = z.object({
  headline: z.string().min(5).max(150),
  summary: z.string().min(10).max(500),
  whyBestOverall: z.string().min(10).max(400),
  whyBestBudget: z.string().min(10).max(400),
  whyPremiumChoice: z.string().min(10).max(400),
  keyTradeoffs: z.array(z.string()).min(1).max(5)
});

export const UserRegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  preferredLang: z.string().default("en")
});

export const UserLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

export const PriceAlertCreateSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  targetPrice: z.number().positive("Target price must be positive")
});

export const WishlistActionSchema = z.object({
  productId: z.string().min(1, "Product ID is required")
});
