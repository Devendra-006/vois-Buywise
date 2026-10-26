"use client";

import React, { useState } from "react";
import { Search, SlidersHorizontal, X, ArrowRight, Check } from "lucide-react";
import { SearchWeights, ParsedQuery } from "@buywise/shared";

interface SearchBarProps {
  initialQuery?: string;
  onSearch: (query: string, weights?: SearchWeights) => void;
  isLoading?: boolean;
  parsedCriteria?: ParsedQuery;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  initialQuery = "",
  onSearch,
  isLoading = false,
  parsedCriteria
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [showWeights, setShowWeights] = useState(false);
  const [weights, setWeights] = useState<SearchWeights>({
    price: 0.30,
    rating: 0.25,
    reviews: 0.25,
    delivery: 0.20
  });

  const exampleChips = [
    "TWS Earbuds under ₹3,000 with ANC",
    "Best 5G phones under ₹25,000",
    "Thin & Light Laptop for Coding",
    "boAt vs OnePlus Earbuds under ₹2000"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query.trim(), weights);
  };

  const handleChipClick = (chip: string) => {
    setQuery(chip);
    onSearch(chip, weights);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Search Bar Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center bg-surface border-2 border-border focus-within:border-ink rounded-lg shadow-sm transition-all">
          <div className="pl-4 pr-2 text-ink-muted flex items-center">
            <Search className="w-5 h-5 text-ink-secondary" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search e.g. 'earbuds under 3000', 'phones for photography'..."
            className="w-full py-3.5 sm:py-4 px-2 text-base text-ink placeholder:text-ink-muted bg-transparent focus:outline-none"
            disabled={isLoading}
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1.5 text-ink-muted hover:text-ink transition-colors mr-1"
              aria-label="Clear query"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Preferences Button */}
          <button
            type="button"
            onClick={() => setShowWeights(!showWeights)}
            className={`p-2.5 mr-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              showWeights ? "bg-ink text-surface" : "text-ink-secondary hover:text-ink hover:bg-background"
            }`}
            title="Adjust factor weights"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Priorities</span>
          </button>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="mr-2 px-4 sm:px-5 py-2.5 bg-brand-green text-surface rounded font-medium text-sm hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
          >
            {isLoading ? (
              <span className="animate-spin w-4 h-4 border-2 border-surface border-t-transparent rounded-full" />
            ) : (
              <>
                <span>Search</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Weight Tuning Panel */}
      {showWeights && (
        <div className="mt-3 p-4 bg-surface border border-border rounded-lg shadow-sm">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-border">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">
              Smart Score Priority Weights (Total = 100%)
            </span>
            <button
              onClick={() => setWeights({ price: 0.3, rating: 0.25, reviews: 0.25, delivery: 0.2 })}
              className="text-xs text-brand-green hover:underline"
            >
              Reset to Defaults
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-ink">Price Value</span>
                <span className="text-ink-muted font-mono">{Math.round((weights.price || 0) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.price || 0}
                onChange={(e) => setWeights({ ...weights, price: parseFloat(e.target.value) })}
                className="w-full accent-brand-green cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-ink">Rating Quality</span>
                <span className="text-ink-muted font-mono">{Math.round((weights.rating || 0) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.rating || 0}
                onChange={(e) => setWeights({ ...weights, rating: parseFloat(e.target.value) })}
                className="w-full accent-brand-green cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-ink">Review Volume</span>
                <span className="text-ink-muted font-mono">{Math.round((weights.reviews || 0) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.reviews || 0}
                onChange={(e) => setWeights({ ...weights, reviews: parseFloat(e.target.value) })}
                className="w-full accent-brand-green cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-ink">Fast Delivery</span>
                <span className="text-ink-muted font-mono">{Math.round((weights.delivery || 0) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.delivery || 0}
                onChange={(e) => setWeights({ ...weights, delivery: parseFloat(e.target.value) })}
                className="w-full accent-brand-green cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Parsed Criteria Chips if active */}
      {parsedCriteria && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-ink-muted font-medium">Extracted Intent:</span>
          <span className="px-2 py-0.5 rounded bg-background border border-border text-ink font-medium capitalize">
            Category: {parsedCriteria.category}
          </span>
          {parsedCriteria.maxPrice && (
            <span className="px-2 py-0.5 rounded bg-brand-green-light border border-brand-green/30 text-brand-green font-medium">
              Budget: ≤ ₹{parsedCriteria.maxPrice.toLocaleString("en-IN")}
            </span>
          )}
          {parsedCriteria.mustHave.map((item, i) => (
            <span key={i} className="px-2 py-0.5 rounded bg-background border border-border text-ink-secondary">
              Must have: {item}
            </span>
          ))}
        </div>
      )}

      {/* Suggested Search Chips */}
      {!parsedCriteria && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-ink-muted font-medium">Try:</span>
          {exampleChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleChipClick(chip)}
              className="px-2.5 py-1 rounded bg-surface border border-border text-ink-secondary hover:text-ink hover:border-ink-secondary transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
