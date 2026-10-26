import { NormalizedProduct, PriceVerdict, ScoredProduct, SearchWeights, calculateSmartScore } from "@buywise/shared";

export function scoreProducts(
  products: NormalizedProduct[],
  verdicts: Record<string, PriceVerdict>,
  weights?: SearchWeights
): ScoredProduct[] {
  return products.map(product => {
    const verdict = verdicts[product.id] || {
      verdict: "insufficient_history" as const,
      label: "History Building",
      explanation: "No price history",
      currentPrice: product.price,
      medianPrice90d: null,
      diffPercent: null,
      snapshotsCount: 0,
      historyDays: 0
    };

    const score = calculateSmartScore(product, products, weights, verdict);

    return {
      ...product,
      score,
      priceVerdict: verdict
    };
  });
}
