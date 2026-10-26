"use client";

import React, { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { SearchBar } from "../components/SearchBar";
import { VerdictBanner } from "../components/VerdictBanner";
import { PickCards } from "../components/PickCards";
import { ComparisonTable } from "../components/ComparisonTable";
import { PriceHistoryChart } from "../components/PriceHistoryChart";
import { ReviewIntelligenceCard } from "../components/ReviewIntelligenceCard";
import { IndianFinanceCalculator } from "../components/IndianFinanceCalculator";
import { DemoDataBanner } from "../components/DemoDataBanner";
import { PriceAlertModal } from "../components/PriceAlertModal";
import { searchProducts, searchProductsStream } from "../lib/api";
import {
  SearchPipelineResult,
  SearchWeights,
  ScoredProduct,
  calculateSmartScore,
  evaluatePriceVerdict,
  selectTopPicks,
  NormalizedProduct
} from "@buywise/shared";
import {
  ShieldCheck,
  Sparkles,
  Zap,
  TrendingDown,
  Layers,
  CheckCircle2,
  X,
  ExternalLink,
  Star
} from "lucide-react";

// Initial benchmark default result so page is rich and instantly interactive on load
import earbudsFixtures from "../../../../fixtures/earbuds.json";
import priceHistoryFixtures from "../../../../fixtures/price_history.json";

function getInitialResult(): SearchPipelineResult {
  const products: NormalizedProduct[] = earbudsFixtures as any;
  const historyMap: any = priceHistoryFixtures;

  const scored: ScoredProduct[] = products.map((p) => {
    const snapshots = historyMap[p.id] || [];
    const priceVerdict = evaluatePriceVerdict(p.price, snapshots);
    const score = calculateSmartScore(p, products, undefined, priceVerdict);

    return {
      ...p,
      score,
      priceVerdict,
      reviewSummary: {
        pros: p.reviewSnippets?.slice(0, 2) || ["Excellent value for price", "Strong battery life"],
        cons: ["Slightly bulky case", "Average call clarity in traffic"],
        sentiment: "positive",
        basedOnReviews: p.reviewCount,
        confidence: "high",
        sourceQuotes: p.reviewSnippets || []
      }
    };
  });

  const topPicks = selectTopPicks(scored);

  return {
    query: "best wireless earbuds under 3000 with ANC",
    parsed: {
      category: "earbuds",
      cleanedQuery: "wireless earbuds",
      maxPrice: 3000,
      minPrice: null,
      mustHave: ["ANC"],
      niceToHave: ["Long battery"],
      targetLanguage: "en"
    },
    topPicks,
    allProducts: scored,
    explanation: {
      headline: "Our Pick: OnePlus Nord Buds 2 at ₹2,499",
      summary: "Among tested earbuds under ₹3,000, OnePlus Nord Buds 2 achieves the highest Smart Score (84/100). It pairs genuine 25dB active noise cancellation with 36 hours of playtime and a high Bayesian rating across 16,000+ verified Indian buyers.",
      whyBestOverall: "Top Smart Score balance: real ANC, IP55 water resistance, fast charging, and dependable audio clarity at ₹2,499.",
      whyBestBudget: "At just ₹999, boAt Airdopes 141 offers 42H playtime and punchy bass, making it the highest value option in the sub-₹1000 tier.",
      whyPremiumChoice: "Sony WF-1000XM5 leads the premium tier with industry-leading HD noise cancellation and audiophile LDAC tuning.",
      keyTradeoffs: [
        "Budget Choice (boAt at ₹999) skips active noise cancellation to maximize battery life.",
        "Best Overall (OnePlus at ₹2,499) gives you true ANC and IP55 protection for just ₹1,500 more."
      ]
    },
    generatedAt: new Date().toISOString(),
    isDemoData: true,
    dataSource: "verified_fixtures"
  };
}

export default function HomePage() {
  const [result, setResult] = useState<SearchPipelineResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>("");
  const [currentLang, setCurrentLang] = useState("en");
  const [selectedProduct, setSelectedProduct] = useState<ScoredProduct | null>(null);
  const [alertProduct, setAlertProduct] = useState<ScoredProduct | null>(null);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  // Load initial result on mount
  useEffect(() => {
    try {
      setResult(getInitialResult());
      const savedWishlist = localStorage.getItem("buywise_wishlist");
      if (savedWishlist) {
        setWishlistIds(new Set(JSON.parse(savedWishlist)));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggleWishlist = (productId: string) => {
    const next = new Set(wishlistIds);
    if (next.has(productId)) {
      next.delete(productId);
    } else {
      next.add(productId);
    }
    setWishlistIds(next);
    localStorage.setItem("buywise_wishlist", JSON.stringify(Array.from(next)));
  };

  const handleSearch = async (searchQuery: string, weights?: SearchWeights) => {
    setLoading(true);
    setProgressMsg("Connecting to BuyWise recommendation agents...");

    try {
      // Try streaming endpoint first for real-time progress
      const cleanup = searchProductsStream(
        searchQuery,
        currentLang,
        (stage, msg) => {
          setProgressMsg(msg);
        },
        (res) => {
          setResult(res);
          setSelectedProduct(res.topPicks.bestOverall);
          setLoading(false);
          setProgressMsg("");
        },
        async () => {
          // Fallback to standard HTTP JSON search
          try {
            const fallbackRes = await searchProducts(searchQuery, weights, currentLang);
            setResult(fallbackRes);
            setSelectedProduct(fallbackRes.topPicks.bestOverall);
          } catch (e: any) {
            console.error("Search error:", e.message);
          } finally {
            setLoading(false);
            setProgressMsg("");
          }
        }
      );
    } catch (err: any) {
      console.error("Search start error:", err.message);
      setLoading(false);
      setProgressMsg("");
    }
  };

  const inspectedProduct = selectedProduct || result?.topPicks.bestOverall || null;
  const historyMap: any = priceHistoryFixtures;
  const inspectedSnapshots = inspectedProduct ? (historyMap[inspectedProduct.id] || []) : [];

  return (
    <div className="min-h-screen bg-background">
      <Header
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        wishlistCount={wishlistIds.size}
        onOpenAlerts={() => {
          if (result) setAlertProduct(result.topPicks.bestOverall);
        }}
      />

      {/* Hero & Search Header */}
      <section className="pt-10 pb-6 px-4 sm:px-6 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green-light border border-brand-green/20 text-brand-green text-xs font-semibold mb-4">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Neutral Cross-Store Shopping Intelligence &bull; Zero Hallucinated Prices</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-ink max-w-2xl mx-auto tracking-tight mb-3 leading-tight">
          Find the right product. Skip the decision fatigue.
        </h1>

        <p className="text-sm sm:text-base text-ink-secondary max-w-xl mx-auto mb-7">
          We fetch real listings across Amazon India, Flipkart, and Croma, compute an open Smart Score, and give you an editorial Wirecutter-style verdict.
        </p>

        {/* Search Bar */}
        <SearchBar
          initialQuery={result?.query || ""}
          onSearch={handleSearch}
          isLoading={loading}
          parsedCriteria={result?.parsed}
        />

        {/* Live SSE progress indicator */}
        {loading && (
          <div className="mt-4 p-3 bg-surface border border-border rounded max-w-xl mx-auto flex items-center justify-center gap-2.5 text-xs text-ink-secondary shadow-sm animate-pulse">
            <span className="w-2 h-2 rounded-full bg-brand-green animate-ping" />
            <span>{progressMsg || "Running multi-agent pipeline..."}</span>
          </div>
        )}
      </section>

      {/* Main Content Area */}
      {result && (
        <section className="px-4 sm:px-6 max-w-6xl mx-auto pb-16 space-y-8">
          {/* Honest Demo Data Banner */}
          <DemoDataBanner isDemoData={result.isDemoData} />

          {/* 1. Wirecutter-style Top Verdict Banner */}
          <VerdictBanner
            explanation={result.explanation}
            bestOverall={result.topPicks.bestOverall}
            onViewProduct={(id) => {
              const p = result.allProducts.find((item) => item.id === id);
              if (p) setSelectedProduct(p);
            }}
          />

          {/* 2. Top 3 Pick Cards (Overall, Budget, Premium) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif font-bold text-2xl text-ink">
                Our Curated Recommendations
              </h2>
              <span className="text-xs text-ink-muted">
                Based on {result.allProducts.length} verified listings
              </span>
            </div>

            <PickCards
              topPicks={result.topPicks}
              explanation={result.explanation}
              onSelectProduct={(p) => setSelectedProduct(p)}
              onToggleWishlist={handleToggleWishlist}
              onOpenAlertModal={(p) => setAlertProduct(p)}
              wishlistIds={wishlistIds}
            />
          </div>

          {/* 3. Side-by-Side Comparison Matrix */}
          <ComparisonTable
            products={[
              result.topPicks.bestOverall,
              result.topPicks.bestBudget,
              result.topPicks.premiumChoice
            ]}
            category={result.parsed.category}
          />

          {/* 4. Deep Inspection Section for Selected Product */}
          {inspectedProduct && (
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs font-semibold text-brand-green uppercase tracking-wider block">
                    Product Deep Dive
                  </span>
                  <h3 className="font-serif font-bold text-2xl text-ink">
                    {inspectedProduct.title}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="font-mono text-2xl font-bold text-brand-green">
                    ₹{inspectedProduct.price.toLocaleString("en-IN")}
                  </span>
                  <span className="block text-xs text-ink-muted">
                    on {inspectedProduct.store}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Historical Price Chart */}
                <PriceHistoryChart
                  productTitle={inspectedProduct.title}
                  verdict={inspectedProduct.priceVerdict}
                  snapshots={inspectedSnapshots}
                />

                {/* Review Intelligence & Sentiment */}
                <ReviewIntelligenceCard
                  productTitle={inspectedProduct.title}
                  reviews={inspectedProduct.reviewSummary}
                />
              </div>

              {/* Indian Retail Realities: EMI & Bank Offers */}
              <div className="mt-6">
                <IndianFinanceCalculator price={inspectedProduct.price} />
              </div>
            </div>
          )}
        </section>
      )}

      {/* Price Alert Modal */}
      <PriceAlertModal
        product={alertProduct}
        isOpen={!!alertProduct}
        onClose={() => setAlertProduct(null)}
      />
    </div>
  );
}
