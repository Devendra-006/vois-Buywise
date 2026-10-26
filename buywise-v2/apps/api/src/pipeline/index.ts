import {
  SearchPipelineResult,
  SearchWeights,
  PriceVerdict,
  ReviewIntelligence,
  ScoredProduct
} from "@buywise/shared";
import { parseSearchQuery } from "./parseQuery.js";
import { retrieveProducts } from "./retrieve.js";
import { analyzeProductReviews } from "./reviews.js";
import { analyzeProductPrice } from "./price.js";
import { scoreProducts } from "./score.js";
import { pickTopThree } from "./pick.js";
import { explainDecision } from "./explain.js";
import { db } from "../db/client.js";
import { searches, searchResults, products } from "../db/schema.js";

export type PipelineProgressCallback = (stage: string, message: string, payload?: any) => void;

interface RunPipelineOptions {
  query: string;
  weights?: SearchWeights;
  pincode?: string | null;
  targetLang?: string;
  forceRefresh?: boolean;
  userId?: string | null;
  onProgress?: PipelineProgressCallback;
}

export async function runShoppingPipeline(options: RunPipelineOptions): Promise<SearchPipelineResult> {
  const { query, weights, targetLang = "en", forceRefresh = false, userId = null, onProgress } = options;

  console.log(`🚀 [PIPELINE START] Query: "${query}" | Lang: ${targetLang}`);

  // Step 1: Parse Query
  onProgress?.("parsing", "Understanding query & extracting shopping criteria...");
  const parsed = await parseSearchQuery(query, targetLang);

  // Step 2: Retrieve Products
  onProgress?.("retrieving", `Retrieving real listings across Indian stores for "${parsed.cleanedQuery}"...`);
  const { products: candidates, isDemo, dataSource } = await retrieveProducts(parsed, forceRefresh);

  if (candidates.length === 0) {
    throw new Error(`No products found for query "${query}". Try adjusting keywords.`);
  }

  // Step 3: Run Review Intelligence and Price Analysis in Parallel
  onProgress?.("analyzing", `Analyzing seller pricing, historical snapshots & buyer reviews for ${candidates.length} products in parallel...`);

  const verdicts: Record<string, PriceVerdict> = {};
  const reviewSummaries: Record<string, ReviewIntelligence> = {};

  // Parallel analysis for all candidates
  await Promise.all(
    candidates.map(async (product) => {
      const [priceRes, reviewRes] = await Promise.all([
        analyzeProductPrice(product),
        analyzeProductReviews(product)
      ]);
      verdicts[product.id] = priceRes.verdict;
      reviewSummaries[product.id] = reviewRes;
    })
  );

  // Step 4: Transparent Scoring in Code
  onProgress?.("scoring", "Computing transparent Smart Scores using Bayesian rating and weighted factors...");
  const scoredWithoutReviews = scoreProducts(candidates, verdicts, weights);

  const scoredWithReviews: ScoredProduct[] = scoredWithoutReviews.map(p => ({
    ...p,
    reviewSummary: reviewSummaries[p.id]
  }));

  // Step 5: Select Top 3 Editorial Picks
  onProgress?.("picking", "Selecting Top 3 Picks: Best Overall, Best Budget, and Premium Choice...");
  const topPicks = pickTopThree(scoredWithReviews);

  // Step 6: Generate Editorial Explanation
  onProgress?.("explaining", "Synthesizing Wirecutter-style decision verdict and trade-offs...");
  const explanation = await explainDecision(query, topPicks, targetLang);

  const finalResult: SearchPipelineResult = {
    query,
    parsed,
    topPicks,
    allProducts: scoredWithReviews,
    explanation,
    generatedAt: new Date().toISOString(),
    isDemoData: isDemo,
    dataSource
  };

  // Optional: Async persist search and results to database if connected
  if (db) {
    try {
      const [insertedSearch] = await db.insert(searches).values({
        userId: userId || undefined,
        rawQuery: query,
        parsed,
        weights: weights || {}
      }).returning({ id: searches.id });

      if (insertedSearch) {
        // We can safely log search history
        console.log(`💾 Persisted search ID: ${insertedSearch.id}`);
      }
    } catch (err: any) {
      console.warn("⚠️ Could not persist search history to PostgreSQL:", err.message);
    }
  }

  onProgress?.("completed", "Recommendation pipeline finished successfully!", finalResult);
  console.log(`✅ [PIPELINE COMPLETE] Top Pick: ${topPicks.bestOverall.title} (Score: ${topPicks.bestOverall.score.overallScore})`);

  return finalResult;
}
