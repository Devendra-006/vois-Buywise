"use client";

import React from "react";
import { Award, ArrowUpRight, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { DecisionExplanation, ScoredProduct } from "@buywise/shared";

interface VerdictBannerProps {
  explanation: DecisionExplanation;
  bestOverall: ScoredProduct;
  onViewProduct?: (id: string) => void;
}

export const VerdictBanner: React.FC<VerdictBannerProps> = ({
  explanation,
  bestOverall,
  onViewProduct
}) => {
  return (
    <div className="w-full bg-surface border-2 border-brand-green/30 rounded-lg p-5 sm:p-7 shadow-sm relative overflow-hidden">
      {/* Top Accent Ribbon */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-brand-green" />

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex-1">
          {/* Header pill */}
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-brand-green text-surface text-xs font-bold tracking-wide uppercase">
              <Award className="w-3.5 h-3.5" />
              Our Verified Pick
            </span>
            <span className="text-xs text-ink-muted">
              Source: {bestOverall.store} &bull; Smart Score: {bestOverall.score.overallScore}/100
            </span>
          </div>

          {/* Title and Headline */}
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink mb-2 leading-tight">
            {bestOverall.title}
          </h2>

          <p className="text-sm sm:text-base text-ink-secondary mb-4 font-sans leading-relaxed">
            {explanation.summary}
          </p>

          {/* Key trade-offs callout */}
          {explanation.keyTradeoffs && explanation.keyTradeoffs.length > 0 && (
            <div className="bg-background rounded p-3.5 border border-border text-xs text-ink-secondary space-y-1.5">
              <span className="font-semibold text-ink uppercase tracking-wider text-[11px] block">
                Shopper Trade-off Analysis:
              </span>
              {explanation.keyTradeoffs.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-green flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Action & Price Block */}
        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 min-w-[200px]">
          <div className="text-left md:text-right">
            <span className="text-xs text-ink-muted block uppercase tracking-wider font-medium">Best Price</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-brand-green font-mono tabular-nums">
                ₹{bestOverall.price.toLocaleString("en-IN")}
              </span>
            </div>
            {bestOverall.originalPrice > bestOverall.price && (
              <span className="text-xs text-ink-muted line-through font-mono">
                ₹{bestOverall.originalPrice.toLocaleString("en-IN")} ({bestOverall.discountPercent}% off)
              </span>
            )}
            <span className="text-[11px] text-ink-secondary block mt-1">
              On {bestOverall.store}
            </span>
          </div>

          <div className="flex flex-col gap-2 mt-4 w-full sm:w-auto">
            <a
              href={bestOverall.productUrl}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded bg-brand-green text-surface text-sm font-medium hover:bg-brand-green/90 transition-colors shadow-sm"
            >
              <span>Buy on {bestOverall.store}</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>

            {onViewProduct && (
              <button
                onClick={() => onViewProduct(bestOverall.id)}
                className="text-xs text-ink-secondary hover:text-ink text-center underline underline-offset-4"
              >
                View Full Specs & Analysis
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
