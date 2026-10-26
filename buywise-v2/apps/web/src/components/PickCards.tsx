"use client";

import React from "react";
import { TopPicks, ScoredProduct, DecisionExplanation } from "@buywise/shared";
import { Award, Wallet, Sparkles, ArrowUpRight, Heart, Bell, Scale, Star, Clock } from "lucide-react";

interface PickCardsProps {
  topPicks: TopPicks;
  explanation: DecisionExplanation;
  onSelectProduct: (product: ScoredProduct) => void;
  onToggleWishlist?: (productId: string) => void;
  onOpenAlertModal?: (product: ScoredProduct) => void;
  wishlistIds?: Set<string>;
}

export const PickCards: React.FC<PickCardsProps> = ({
  topPicks,
  explanation,
  onSelectProduct,
  onToggleWishlist,
  onOpenAlertModal,
  wishlistIds = new Set()
}) => {
  const cards = [
    {
      type: "bestOverall" as const,
      product: topPicks.bestOverall,
      title: "Best Overall",
      subtitle: "Highest Smart Score balance",
      icon: Award,
      badgeBg: "bg-brand-green text-surface",
      borderAccent: "border-brand-green/40",
      reason: explanation.whyBestOverall
    },
    {
      type: "bestBudget" as const,
      product: topPicks.bestBudget,
      title: "Best Budget",
      subtitle: "Highest value in entry tier",
      icon: Wallet,
      badgeBg: "bg-ink text-surface",
      borderAccent: "border-border",
      reason: explanation.whyBestBudget
    },
    {
      type: "premiumChoice" as const,
      product: topPicks.premiumChoice,
      title: "Premium Choice",
      subtitle: "Top-tier specs & build",
      icon: Sparkles,
      badgeBg: "bg-brand-amber text-surface",
      borderAccent: "border-brand-amber/40",
      reason: explanation.whyPremiumChoice
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      {cards.map(({ type, product, title, subtitle, icon: Icon, badgeBg, borderAccent, reason }) => {
        const isSaved = wishlistIds.has(product.id);
        const verdict = product.priceVerdict;

        return (
          <div
            key={type}
            className={`editorial-card rounded-lg p-5 flex flex-col justify-between border-2 ${borderAccent} transition-all hover:shadow-md relative`}
          >
            {/* Top Badge & Save Button */}
            <div className="flex items-center justify-between mb-3">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${badgeBg}`}>
                <Icon className="w-3.5 h-3.5" />
                {title}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onToggleWishlist?.(product.id)}
                  className={`p-1.5 rounded border border-border hover:border-ink transition-colors ${
                    isSaved ? "text-brand-red bg-brand-red-light border-brand-red/30" : "text-ink-secondary"
                  }`}
                  title={isSaved ? "Remove from Saved" : "Save to Wishlist"}
                >
                  <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-current" : ""}`} />
                </button>
                <button
                  onClick={() => onOpenAlertModal?.(product)}
                  className="p-1.5 rounded border border-border text-ink-secondary hover:text-ink hover:border-ink transition-colors"
                  title="Track Price Drop"
                >
                  <Bell className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Product Image and Store Timestamp */}
            <div className="flex gap-4 mb-4">
              <div className="w-24 h-24 rounded bg-background border border-border overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full h-full object-contain mix-blend-multiply"
                  onError={(e: any) => {
                    e.target.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80";
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 text-[11px] text-ink-muted mb-1">
                  <span className="font-semibold text-ink-secondary">{product.store}</span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    Fetched today
                  </span>
                </div>

                <h3
                  onClick={() => onSelectProduct(product)}
                  className="font-serif font-bold text-base text-ink line-clamp-2 hover:text-brand-green cursor-pointer leading-snug"
                  title={product.title}
                >
                  {product.title}
                </h3>

                {/* Rating & verified reviews */}
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-ink-secondary">
                  <span className="inline-flex items-center gap-0.5 text-brand-amber font-semibold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {product.rating}
                  </span>
                  <span className="text-ink-muted">
                    ({product.reviewCount.toLocaleString()} reviews)
                  </span>
                </div>
              </div>
            </div>

            {/* Price & Verdict Badge */}
            <div className="bg-background rounded p-3 mb-4 border border-border">
              <div className="flex items-baseline justify-between mb-1">
                <div>
                  <span className="text-xl font-bold font-mono text-ink tabular-nums">
                    ₹{product.price.toLocaleString("en-IN")}
                  </span>
                  {product.originalPrice > product.price && (
                    <span className="text-xs text-ink-muted line-through ml-2 font-mono">
                      ₹{product.originalPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>

                {/* Price Verdict Badge */}
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    verdict.verdict === "good_price"
                      ? "bg-brand-green-light text-brand-green border border-brand-green/30"
                      : verdict.verdict === "wait"
                      ? "bg-brand-amber-light text-brand-amber border border-brand-amber/30"
                      : "bg-surface text-ink-secondary border border-border"
                  }`}
                >
                  {verdict.label}
                </span>
              </div>

              {/* Smart Score meter */}
              <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-xs">
                <span className="font-medium text-ink-secondary">BuyWise Smart Score</span>
                <span className="font-bold text-brand-green font-mono text-sm">
                  {product.score.overallScore} / 100
                </span>
              </div>

              {/* Factor mini breakdown bars */}
              <div className="grid grid-cols-3 gap-1.5 mt-2 text-[10px] text-ink-muted">
                <div>
                  <div className="flex justify-between mb-0.5">
                    <span>Price</span>
                    <span className="font-mono">{product.score.factors.priceScore}</span>
                  </div>
                  <div className="h-1 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-green rounded-full"
                      style={{ width: `${product.score.factors.priceScore}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-0.5">
                    <span>Rating</span>
                    <span className="font-mono">{product.score.factors.ratingScore}</span>
                  </div>
                  <div className="h-1 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-green rounded-full"
                      style={{ width: `${product.score.factors.ratingScore}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-0.5">
                    <span>Trust</span>
                    <span className="font-mono">{product.score.factors.sellerTrustScore}</span>
                  </div>
                  <div className="h-1 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-green rounded-full"
                      style={{ width: `${product.score.factors.sellerTrustScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Why it was picked */}
            <p className="text-xs text-ink-secondary mb-4 italic leading-relaxed line-clamp-3">
              "{reason}"
            </p>

            {/* Card Footer Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <button
                onClick={() => onSelectProduct(product)}
                className="flex-1 py-2 text-xs font-semibold text-ink border border-border rounded hover:bg-background transition-colors text-center"
              >
                Inspect Specs
              </button>
              <a
                href={product.productUrl}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="flex-1 py-2 text-xs font-semibold text-surface bg-brand-green rounded hover:bg-brand-green/90 transition-colors flex items-center justify-center gap-1 shadow-sm"
              >
                <span>Store Deal</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
};
