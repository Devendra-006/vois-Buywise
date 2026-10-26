export type ProductSource =
  | "Amazon India"
  | "Flipkart"
  | "Croma"
  | "Reliance Digital"
  | "Tata CLiQ"
  | "Google Shopping";

export type ProductCategory = "earbuds" | "smartphones" | "laptops" | "general";

export interface NormalizedProduct {
  id: string;
  title: string;
  brand: string;
  category: ProductCategory;
  store: ProductSource;
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  productUrl: string;
  imageUrl: string;
  inStock: boolean;
  deliveryDays: number | null;
  seller: string;
  isFulfilled: boolean;
  specs: Record<string, string | number | boolean>;
  reviewSnippets: string[];
  fetchedAt: string;
  isDemoData: boolean;
}

export interface ScoreFactors {
  priceScore: number;
  ratingScore: number;
  reviewVolumeScore: number;
  deliveryScore: number | null;
  sellerTrustScore: number;
  priceFairnessScore: number | null;
}

export interface ScoreBreakdown {
  overallScore: number;
  factors: ScoreFactors;
  weightsUsed: Record<string, number>;
}

export type VerdictType = "good_price" | "fair_price" | "wait" | "insufficient_history";

export interface PriceSnapshot {
  id?: string;
  productId: string;
  price: number;
  currency: string;
  store: string;
  inStock: boolean;
  fetchedAt: string;
}

export interface PriceVerdict {
  verdict: VerdictType;
  label: string;
  explanation: string;
  currentPrice: number;
  medianPrice90d: number | null;
  diffPercent: number | null;
  snapshotsCount: number;
  historyDays: number;
}

export interface ReviewIntelligence {
  pros: string[];
  cons: string[];
  sentiment: "positive" | "mixed" | "neutral";
  basedOnReviews: number;
  confidence: "high" | "medium" | "low";
  sourceQuotes?: string[];
}

export interface ScoredProduct extends NormalizedProduct {
  score: ScoreBreakdown;
  priceVerdict: PriceVerdict;
  reviewSummary?: ReviewIntelligence;
}

export interface TopPicks {
  bestOverall: ScoredProduct;
  bestBudget: ScoredProduct;
  premiumChoice: ScoredProduct;
}

export interface DecisionExplanation {
  headline: string;
  summary: string;
  whyBestOverall: string;
  whyBestBudget: string;
  whyPremiumChoice: string;
  keyTradeoffs: string[];
}

export interface ParsedQuery {
  category: ProductCategory;
  cleanedQuery: string;
  maxPrice: number | null;
  minPrice: number | null;
  mustHave: string[];
  niceToHave: string[];
  targetLanguage: string;
}

export interface SearchWeights {
  price?: number;
  reviews?: number;
  rating?: number;
  delivery?: number;
}

export interface SearchPipelineResult {
  query: string;
  parsed: ParsedQuery;
  topPicks: TopPicks;
  allProducts: ScoredProduct[];
  explanation: DecisionExplanation;
  generatedAt: string;
  isDemoData: boolean;
  dataSource: string;
}

export interface WishlistItem {
  userId: string;
  productId: string;
  addedAt: string;
  product?: NormalizedProduct;
}

export interface PriceAlertItem {
  id: string;
  userId: string;
  productId: string;
  targetPrice: number;
  active: boolean;
  createdAt: string;
  lastNotifiedAt: string | null;
  product?: NormalizedProduct;
}
