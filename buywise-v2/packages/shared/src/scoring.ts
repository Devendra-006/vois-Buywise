import {
  NormalizedProduct,
  ScoreBreakdown,
  ScoreFactors,
  ScoredProduct,
  TopPicks,
  PriceVerdict,
  PriceSnapshot
} from "./types.js";

/**
 * Bayesian rating calculation: pulls low-volume ratings toward a prior
 * C = prior average (4.0), m = minimum reviews weight threshold (50)
 */
export function calculateBayesianRating(rating: number, reviewCount: number, C = 4.0, m = 50): number {
  if (reviewCount <= 0 || !rating) return C;
  return (reviewCount / (reviewCount + m)) * rating + (m / (reviewCount + m)) * C;
}

/**
 * Min-max normalizer clamped to [0, 1]
 */
function minMaxNormalize(val: number, min: number, max: number, invert = false): number {
  if (max === min) return 0.5;
  const norm = (val - min) / (max - min);
  const clamped = Math.max(0, Math.min(1, norm));
  return invert ? 1 - clamped : clamped;
}

/**
 * Compute the BuyWise Smart Score (0-100) and detailed factor breakdown
 * Dynamically handles missing values by redistributing weight across available factors
 */
export function calculateSmartScore(
  product: NormalizedProduct,
  allCandidates: NormalizedProduct[],
  customWeights?: { price?: number; reviews?: number; rating?: number; delivery?: number },
  priceVerdict?: PriceVerdict
): ScoreBreakdown {
  // Default balanced weights
  const baseWeights = {
    price: customWeights?.price ?? 0.30,
    rating: customWeights?.rating ?? 0.25,
    reviewVolume: customWeights?.reviews ?? 0.20,
    delivery: customWeights?.delivery ?? 0.10,
    sellerTrust: 0.10,
    priceFairness: 0.05
  };

  // Find mins and maxes across candidate pool for normalization
  const validPrices = allCandidates.map(p => p.price).filter(p => p > 0);
  const minPrice = validPrices.length ? Math.min(...validPrices) : product.price;
  const maxPrice = validPrices.length ? Math.max(...validPrices) : product.price;

  const bayesRatings = allCandidates.map(p => calculateBayesianRating(p.rating, p.reviewCount));
  const minBayes = bayesRatings.length ? Math.min(...bayesRatings) : 3.5;
  const maxBayes = bayesRatings.length ? Math.max(...bayesRatings) : 5.0;

  const logReviews = allCandidates.map(p => Math.log10(Math.max(1, p.reviewCount)));
  const minLogRev = logReviews.length ? Math.min(...logReviews) : 0;
  const maxLogRev = logReviews.length ? Math.max(...logReviews) : 4;

  const validDeliveries = allCandidates.map(p => p.deliveryDays).filter((d): d is number => d !== null);
  const minDelivery = validDeliveries.length ? Math.min(...validDeliveries) : 1;
  const maxDelivery = validDeliveries.length ? Math.max(...validDeliveries) : 7;

  // 1. Price Score: lower is better
  const normPrice = minMaxNormalize(product.price, minPrice, maxPrice, true);
  const priceScore = Math.round(normPrice * 100);

  // 2. Rating Score: Bayesian average
  const productBayes = calculateBayesianRating(product.rating, product.reviewCount);
  const normRating = minMaxNormalize(productBayes, minBayes, maxBayes, false);
  const ratingScore = Math.round(normRating * 100);

  // 3. Review Volume Score: log scale to prevent 50,000 completely crushing 2,000
  const productLogRev = Math.log10(Math.max(1, product.reviewCount));
  const normVolume = minMaxNormalize(productLogRev, minLogRev, maxLogRev, false);
  const reviewVolumeScore = Math.round(normVolume * 100);

  // 4. Delivery Score: if delivery days known, faster is better
  let deliveryScore: number | null = null;
  if (product.deliveryDays !== null) {
    const normDelivery = minMaxNormalize(product.deliveryDays, minDelivery, maxDelivery, true);
    deliveryScore = Math.round(normDelivery * 100);
  }

  // 5. Seller Trust: fulfilled by Amazon/Flipkart or well known store
  const isTrustedSeller = product.isFulfilled || product.rating >= 4.0;
  const sellerTrustScore = isTrustedSeller ? 90 : 60;

  // 6. Price Fairness: if history is present
  let priceFairnessScore: number | null = null;
  if (priceVerdict && priceVerdict.verdict !== "insufficient_history" && priceVerdict.diffPercent !== null) {
    // diffPercent: negative means current price is cheaper than median (great)
    if (priceVerdict.diffPercent <= -10) priceFairnessScore = 95;
    else if (priceVerdict.diffPercent <= -5) priceFairnessScore = 85;
    else if (priceVerdict.diffPercent <= 5) priceFairnessScore = 70;
    else if (priceVerdict.diffPercent <= 15) priceFairnessScore = 45;
    else priceFairnessScore = 25;
  }

  // Compile active factors and redistribute missing weights
  const factors: ScoreFactors = {
    priceScore,
    ratingScore,
    reviewVolumeScore,
    deliveryScore,
    sellerTrustScore,
    priceFairnessScore
  };

  const activeWeights: Record<string, number> = {};
  let totalActiveWeight = 0;

  activeWeights.price = baseWeights.price;
  totalActiveWeight += baseWeights.price;

  activeWeights.rating = baseWeights.rating;
  totalActiveWeight += baseWeights.rating;

  activeWeights.reviewVolume = baseWeights.reviewVolume;
  totalActiveWeight += baseWeights.reviewVolume;

  activeWeights.sellerTrust = baseWeights.sellerTrust;
  totalActiveWeight += baseWeights.sellerTrust;

  if (deliveryScore !== null) {
    activeWeights.delivery = baseWeights.delivery;
    totalActiveWeight += baseWeights.delivery;
  }

  if (priceFairnessScore !== null) {
    activeWeights.priceFairness = baseWeights.priceFairness;
    totalActiveWeight += baseWeights.priceFairness;
  }

  // Weighted sum normalized by sum of active weights
  let weightedSum = 0;
  weightedSum += priceScore * (activeWeights.price / totalActiveWeight);
  weightedSum += ratingScore * (activeWeights.rating / totalActiveWeight);
  weightedSum += reviewVolumeScore * (activeWeights.reviewVolume / totalActiveWeight);
  weightedSum += sellerTrustScore * (activeWeights.sellerTrust / totalActiveWeight);

  if (deliveryScore !== null) {
    weightedSum += deliveryScore * (activeWeights.delivery / totalActiveWeight);
  }
  if (priceFairnessScore !== null) {
    weightedSum += priceFairnessScore * (activeWeights.priceFairness / totalActiveWeight);
  }

  const overallScore = Math.min(100, Math.max(10, Math.round(weightedSum)));

  return {
    overallScore,
    factors,
    weightsUsed: activeWeights
  };
}

/**
 * Determine Price Verdict based on real historical snapshot data
 * Requires at least 5 snapshots over 14+ days for a confident verdict
 */
export function evaluatePriceVerdict(currentPrice: number, snapshots: PriceSnapshot[]): PriceVerdict {
  if (!snapshots || snapshots.length < 5) {
    return {
      verdict: "insufficient_history",
      label: "History Building",
      explanation: "Not enough price history yet (requires at least 5 snapshots across 14+ days)",
      currentPrice,
      medianPrice90d: null,
      diffPercent: null,
      snapshotsCount: snapshots?.length || 0,
      historyDays: 0
    };
  }

  const timestamps = snapshots.map(s => new Date(s.fetchedAt).getTime());
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const diffDays = Math.max(1, Math.round((maxTime - minTime) / (1000 * 60 * 60 * 24)));

  if (diffDays < 14) {
    return {
      verdict: "insufficient_history",
      label: "History Building",
      explanation: `Only ${diffDays} days of data recorded. Need 14+ days for confident verdict`,
      currentPrice,
      medianPrice90d: null,
      diffPercent: null,
      snapshotsCount: snapshots.length,
      historyDays: diffDays
    };
  }

  // Calculate median of past snapshots
  const prices = snapshots.map(s => s.price).sort((a, b) => a - b);
  const mid = Math.floor(prices.length / 2);
  const medianPrice = prices.length % 2 !== 0 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;

  const diffPercent = Math.round(((currentPrice - medianPrice) / medianPrice) * 100);

  if (diffPercent < -5) {
    return {
      verdict: "good_price",
      label: "Buy Now",
      explanation: `Price is ${Math.abs(diffPercent)}% below typical 90-day median (₹${medianPrice.toLocaleString('en-IN')})`,
      currentPrice,
      medianPrice90d: medianPrice,
      diffPercent,
      snapshotsCount: snapshots.length,
      historyDays: diffDays
    };
  } else if (diffPercent > 5) {
    return {
      verdict: "wait",
      label: "Wait for Deal",
      explanation: `Price is ${diffPercent}% higher than typical 90-day median (₹${medianPrice.toLocaleString('en-IN')})`,
      currentPrice,
      medianPrice90d: medianPrice,
      diffPercent,
      snapshotsCount: snapshots.length,
      historyDays: diffDays
    };
  } else {
    return {
      verdict: "fair_price",
      label: "Fair Price",
      explanation: `Current price is close to the 90-day median (₹${medianPrice.toLocaleString('en-IN')})`,
      currentPrice,
      medianPrice90d: medianPrice,
      diffPercent,
      snapshotsCount: snapshots.length,
      historyDays: diffDays
    };
  }
}

/**
 * Select the Top 3 Editorial Picks: Best Overall, Best Budget, Premium Choice
 */
export function selectTopPicks(scoredProducts: ScoredProduct[]): TopPicks {
  if (scoredProducts.length === 0) {
    throw new Error("Cannot select top picks from empty product list");
  }

  if (scoredProducts.length === 1) {
    const single = scoredProducts[0];
    return { bestOverall: single, bestBudget: single, premiumChoice: single };
  }

  // Sort by overall score descending
  const sortedByScore = [...scoredProducts].sort((a, b) => b.score.overallScore - a.score.overallScore);
  const bestOverall = sortedByScore[0];

  // Sort by price ascending
  const sortedByPrice = [...scoredProducts].sort((a, b) => a.price - b.price);
  const thirdCount = Math.max(1, Math.floor(sortedByPrice.length / 3));

  // Best Budget: highest score among lowest 1/3 price tier
  const budgetTier = sortedByPrice.slice(0, thirdCount);
  const bestBudget = [...budgetTier].sort((a, b) => b.score.overallScore - a.score.overallScore)[0] || sortedByPrice[0];

  // Premium Choice: highest rating/score among highest 1/3 price tier
  const premiumTier = sortedByPrice.slice(-thirdCount);
  const premiumChoice = [...premiumTier].sort((a, b) => {
    // In premium tier, prioritize high specs/rating and overall score
    const scoreDiff = b.score.overallScore - a.score.overallScore;
    const ratingDiff = b.rating - a.rating;
    return ratingDiff !== 0 ? ratingDiff : scoreDiff;
  })[0] || sortedByPrice[sortedByPrice.length - 1];

  return {
    bestOverall,
    bestBudget,
    premiumChoice
  };
}
