import { DecisionExplanation, DecisionExplanationLLMSchema, TopPicks } from "@buywise/shared";
import { callStructuredLLM } from "../lib/llm.js";

export async function explainDecision(
  query: string,
  picks: TopPicks,
  targetLang = "en"
): Promise<DecisionExplanation> {
  const { bestOverall, bestBudget, premiumChoice } = picks;

  // Rule-based fallback explanation
  const fallback: DecisionExplanation = {
    headline: `Top Recommendation: ${bestOverall.title.slice(0, 40)}... at ₹${bestOverall.price.toLocaleString("en-IN")}`,
    summary: `We analyzed candidate products for "${query}" across pricing, verified buyer feedback, ratings, and seller reliability. ${bestOverall.brand} scores highest overall (Smart Score: ${bestOverall.score.overallScore}/100) by striking the best balance between price, real buyer satisfaction, and feature set.`,
    whyBestOverall: `Awarded Best Overall due to an outstanding score of ${bestOverall.score.overallScore}/100 with a ${bestOverall.rating}★ rating across ${bestOverall.reviewCount.toLocaleString()} verified buyers.`,
    whyBestBudget: `Priced at ₹${bestBudget.price.toLocaleString("en-IN")}, this is the strongest performer in the entry price tier, delivering ${bestBudget.score.factors.reviewVolumeScore}% volume confidence without sacrificing core essentials.`,
    whyPremiumChoice: `At ₹${premiumChoice.price.toLocaleString("en-IN")}, ${premiumChoice.title.slice(0, 30)} offers premium build and category-leading performance (${premiumChoice.rating}★ rating).`,
    keyTradeoffs: [
      `Budget vs Overall: Save ₹${Math.abs(bestOverall.price - bestBudget.price).toLocaleString("en-IN")} with ${bestBudget.brand}, but compromise slightly on advanced specs.`,
      `Overall vs Premium: Spending ₹${Math.abs(premiumChoice.price - bestOverall.price).toLocaleString("en-IN")} extra on ${premiumChoice.brand} buys flagship materials and superior features.`
    ]
  };

  const systemPrompt = `You are the Decision Explainer Agent for BuyWise, an editorial shopping guide for Indian buyers.
Explain why each product was chosen for its specific category based strictly on the provided scores, prices in INR (₹), and ratings.

CRITICAL:
1. NEVER alter ranks, scores, or prices.
2. Be direct, authoritative, and concise (like a Wirecutter verdict).
3. Highlight actual trade-offs.
4. Output valid JSON matching schema:
   headline: string
   summary: string
   whyBestOverall: string
   whyBestBudget: string
   whyPremiumChoice: string
   keyTradeoffs: string[]`;

  const userPrompt = `Query: "${query}"
Language: ${targetLang}
<untrusted_content>
1. Best Overall: ${bestOverall.title} | Price: ₹${bestOverall.price} | Score: ${bestOverall.score.overallScore} | Rating: ${bestOverall.rating}★ (${bestOverall.reviewCount} reviews) | Verdict: ${bestOverall.priceVerdict.label}
2. Best Budget: ${bestBudget.title} | Price: ₹${bestBudget.price} | Score: ${bestBudget.score.overallScore} | Rating: ${bestBudget.rating}★ (${bestBudget.reviewCount} reviews)
3. Premium Choice: ${premiumChoice.title} | Price: ₹${premiumChoice.price} | Score: ${premiumChoice.score.overallScore} | Rating: ${premiumChoice.rating}★ (${premiumChoice.reviewCount} reviews)
</untrusted_content>`;

  const result = await callStructuredLLM<DecisionExplanation>({
    systemPrompt,
    userPrompt,
    schema: DecisionExplanationLLMSchema,
    temperature: 0.3,
    maxTokens: 700
  });

  return result || fallback;
}
