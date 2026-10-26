import { describe, it } from "node:test";
import assert from "node:assert";
import {
  calculateBayesianRating,
  calculateSmartScore,
  evaluatePriceVerdict,
  selectTopPicks,
  NormalizedProduct,
  PriceSnapshot
} from "./index.js";

describe("Bayesian Rating Calculation", () => {
  it("should pull low-review products toward the prior (4.0)", () => {
    // 5.0 with only 2 reviews should not beat a solid 4.6 with 2000 reviews
    const lowReviewsBayes = calculateBayesianRating(5.0, 2);
    const highReviewsBayes = calculateBayesianRating(4.6, 2000);

    assert.ok(lowReviewsBayes < 4.1, `Expected low-review 5.0 to be ~4.04, got ${lowReviewsBayes}`);
    assert.ok(highReviewsBayes > 4.5, `Expected high-review 4.6 to stay high, got ${highReviewsBayes}`);
    assert.ok(highReviewsBayes > lowReviewsBayes, "Established 4.6 should beat 2-review 5.0");
  });
});

describe("Smart Score & Top 3 Picks", () => {
  const sampleProducts: NormalizedProduct[] = [
    {
      id: "p1",
      title: "OnePlus Nord Buds 2",
      brand: "OnePlus",
      category: "earbuds",
      store: "Amazon India",
      price: 2499,
      originalPrice: 2999,
      discountPercent: 17,
      rating: 4.3,
      reviewCount: 14500,
      productUrl: "https://amazon.in/dp/example1",
      imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df",
      inStock: true,
      deliveryDays: 2,
      seller: "Appario Retail",
      isFulfilled: true,
      specs: { anc: true, batteryHours: 36, ipRating: "IP55" },
      reviewSnippets: ["Great bass", "ANC is decent for price"],
      fetchedAt: new Date().toISOString(),
      isDemoData: false
    },
    {
      id: "p2",
      title: "boAt Airdopes 141",
      brand: "boAt",
      category: "earbuds",
      store: "Flipkart",
      price: 999,
      originalPrice: 4490,
      discountPercent: 78,
      rating: 4.0,
      reviewCount: 85000,
      productUrl: "https://flipkart.com/dp/example2",
      imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df",
      inStock: true,
      deliveryDays: 3,
      seller: "FlashTech",
      isFulfilled: true,
      specs: { anc: false, batteryHours: 42, ipRating: "IPX4" },
      reviewSnippets: ["Amazing battery life", "Average mic"],
      fetchedAt: new Date().toISOString(),
      isDemoData: false
    },
    {
      id: "p3",
      title: "Sony WF-1000XM5",
      brand: "Sony",
      category: "earbuds",
      store: "Croma",
      price: 19990,
      originalPrice: 24990,
      discountPercent: 20,
      rating: 4.7,
      reviewCount: 3200,
      productUrl: "https://croma.com/dp/example3",
      imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df",
      inStock: true,
      deliveryDays: 1,
      seller: "Croma Official",
      isFulfilled: true,
      specs: { anc: true, batteryHours: 24, ipRating: "IPX4" },
      reviewSnippets: ["Class-leading noise cancellation", "Superb audio clarity"],
      fetchedAt: new Date().toISOString(),
      isDemoData: false
    }
  ];

  it("should calculate transparent smart scores and score breakdown", () => {
    const scored = sampleProducts.map(p => ({
      ...p,
      score: calculateSmartScore(p, sampleProducts),
      priceVerdict: {
        verdict: "fair_price" as const,
        label: "Fair Price",
        explanation: "Normal price",
        currentPrice: p.price,
        medianPrice90d: p.price,
        diffPercent: 0,
        snapshotsCount: 10,
        historyDays: 30
      }
    }));

    for (const p of scored) {
      assert.ok(p.score.overallScore >= 0 && p.score.overallScore <= 100);
      assert.ok(p.score.factors.priceScore >= 0);
      assert.ok(p.score.factors.ratingScore >= 0);
      assert.ok(p.score.factors.reviewVolumeScore >= 0);
      assert.ok(p.score.weightsUsed.price > 0);
    }

    const picks = selectTopPicks(scored);
    assert.ok(picks.bestOverall, "Must have Best Overall pick");
    assert.ok(picks.bestBudget, "Must have Best Budget pick");
    assert.ok(picks.premiumChoice, "Must have Premium Choice pick");
    assert.strictEqual(picks.bestBudget.id, "p2", "boAt at 999 should be Best Budget");
    assert.strictEqual(picks.premiumChoice.id, "p3", "Sony at 19990 should be Premium Choice");
  });
});

describe("Price Verdict Evaluation", () => {
  it("should require at least 5 snapshots and 14 days", () => {
    const insufficient: PriceSnapshot[] = [
      { productId: "p1", price: 2499, currency: "INR", store: "Amazon", inStock: true, fetchedAt: "2026-10-01T00:00:00Z" },
      { productId: "p1", price: 2499, currency: "INR", store: "Amazon", inStock: true, fetchedAt: "2026-10-02T00:00:00Z" }
    ];
    const verdict = evaluatePriceVerdict(2499, insufficient);
    assert.strictEqual(verdict.verdict, "insufficient_history");
  });

  it("should detect good deal when price is below 90-day median", () => {
    const snapshots: PriceSnapshot[] = [
      { productId: "p1", price: 3000, currency: "INR", store: "Amazon", inStock: true, fetchedAt: "2026-09-01T00:00:00Z" },
      { productId: "p1", price: 3000, currency: "INR", store: "Amazon", inStock: true, fetchedAt: "2026-09-10T00:00:00Z" },
      { productId: "p1", price: 2900, currency: "INR", store: "Amazon", inStock: true, fetchedAt: "2026-09-20T00:00:00Z" },
      { productId: "p1", price: 3100, currency: "INR", store: "Amazon", inStock: true, fetchedAt: "2026-10-01T00:00:00Z" },
      { productId: "p1", price: 3000, currency: "INR", store: "Amazon", inStock: true, fetchedAt: "2026-10-20T00:00:00Z" }
    ];
    // Median is 3000. Current price 2499 is -17% cheaper
    const verdict = evaluatePriceVerdict(2499, snapshots);
    assert.strictEqual(verdict.verdict, "good_price");
    assert.strictEqual(verdict.label, "Buy Now");
  });
});
