import { NormalizedProduct, ReviewIntelligence, ReviewSummaryLLMSchema } from "@buywise/shared";
import { callStructuredLLM } from "../lib/llm.js";

export async function analyzeProductReviews(product: NormalizedProduct): Promise<ReviewIntelligence> {
  const snippets = product.reviewSnippets || [];
  const reviewCount = product.reviewCount || 0;

  // Determine baseline confidence based on actual review volume
  const confidence = reviewCount > 500 ? "high" : reviewCount > 50 ? "medium" : "low";

  // Fallback heuristic summary if LLM unavailable or snippets minimal
  const fallback: ReviewIntelligence = {
    pros: [
      product.rating >= 4.2 ? "Consistently rated well by buyers" : "Solid basic functionality",
      product.isFulfilled ? "Eligible for fast fulfilled shipping" : "Good value in its price category"
    ],
    cons: [
      reviewCount < 100 ? "Limited long-term buyer feedback available" : "Minor trade-offs typical for this segment"
    ],
    sentiment: product.rating >= 4.0 ? "positive" : "mixed",
    basedOnReviews: reviewCount,
    confidence,
    sourceQuotes: snippets.slice(0, 2)
  };

  if (snippets.length === 0) {
    return fallback;
  }

  const systemPrompt = `You are the Review Intelligence Agent for BuyWise.
Your task is to summarize real user feedback for a product.

RULES:
1. ONLY base your pros and cons on the actual review snippets provided.
2. DO NOT make up claims not present in the snippets.
3. Be concise: 2-3 pros, 1-2 cons.
4. Output strict JSON with:
   pros: string[]
   cons: string[]
   sentiment: "positive" | "mixed" | "neutral"
   basedOnReviews: number (pass through the actual review count)
   confidence: "high" | "medium" | "low"`;

  const userPrompt = `Product: ${product.title} (Rating: ${product.rating}, Total Reviews: ${reviewCount})
<untrusted_content>
Snippets:
${snippets.map((s, i) => `${i + 1}. "${s}"`).join("\n")}
</untrusted_content>`;

  const result = await callStructuredLLM<ReviewIntelligence>({
    systemPrompt,
    userPrompt,
    schema: ReviewSummaryLLMSchema,
    temperature: 0.2,
    maxTokens: 500
  });

  return result || fallback;
}
