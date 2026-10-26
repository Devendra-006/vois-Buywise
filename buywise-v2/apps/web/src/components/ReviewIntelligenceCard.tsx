"use client";

import React from "react";
import { ReviewIntelligence } from "@buywise/shared";
import { Check, AlertCircle, Quote, ShieldAlert, Sparkles } from "lucide-react";

interface ReviewIntelligenceCardProps {
  productTitle: string;
  reviews?: ReviewIntelligence;
}

export const ReviewIntelligenceCard: React.FC<ReviewIntelligenceCardProps> = ({
  productTitle,
  reviews
}) => {
  if (!reviews) return null;

  const confidenceBadge = {
    high: { label: "High Confidence", bg: "bg-brand-green-light text-brand-green border-brand-green/30" },
    medium: { label: "Medium Confidence", bg: "bg-brand-amber-light text-brand-amber border-brand-amber/30" },
    low: { label: "Low Confidence (Early Feedback)", bg: "bg-background text-ink-muted border-border" }
  }[reviews.confidence];

  return (
    <div className="w-full bg-surface border border-border rounded-lg p-5 sm:p-6 shadow-sm">
      {/* Header and Confidence */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-border">
        <div>
          <h3 className="font-serif font-bold text-lg text-ink">
            Verified Review Intelligence
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Synthesized from {reviews.basedOnReviews.toLocaleString()} verified buyer reviews
          </p>
        </div>

        <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${confidenceBadge.bg}`}>
          {confidenceBadge.label}
        </span>
      </div>

      {/* Pros & Cons Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        {/* Pros */}
        <div className="bg-brand-green-light/20 border border-brand-green/20 rounded p-4">
          <span className="text-xs font-bold text-brand-green uppercase tracking-wider block mb-2 flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            Reported Strengths
          </span>
          <ul className="space-y-2 text-xs text-ink-secondary">
            {reviews.pros.map((pro, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1.5 flex-shrink-0" />
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cons */}
        <div className="bg-background border border-border rounded p-4">
          <span className="text-xs font-bold text-ink-muted uppercase tracking-wider block mb-2 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-brand-amber" />
            Reported Trade-offs
          </span>
          <ul className="space-y-2 text-xs text-ink-secondary">
            {reviews.cons.map((con, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-amber mt-1.5 flex-shrink-0" />
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Real Review Quotes citations */}
      {reviews.sourceQuotes && reviews.sourceQuotes.length > 0 && (
        <div className="pt-3 border-t border-border">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block mb-2 flex items-center gap-1">
            <Quote className="w-3.5 h-3.5" />
            Representative Buyer Quotes:
          </span>
          <div className="space-y-1.5 text-xs text-ink-secondary italic">
            {reviews.sourceQuotes.map((quote, i) => (
              <div key={i} className="pl-3 border-l-2 border-border text-ink-secondary">
                "{quote}"
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
