"use client";

import React, { useState } from "react";
import { ScoredProduct, CATEGORY_SPECS, ProductCategory } from "@buywise/shared";
import { Check, X, ArrowUpRight, CheckCircle2 } from "lucide-react";

interface ComparisonTableProps {
  products: ScoredProduct[];
  category?: ProductCategory;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  products,
  category = "earbuds"
}) => {
  const [onlyDifferences, setOnlyDifferences] = useState(false);

  if (!products || products.length === 0) return null;

  // Determine attribute rows to show based on category specs
  const categoryAttrs = CATEGORY_SPECS[category] || CATEGORY_SPECS.general;

  // Standard comparison rows
  const coreRows = [
    {
      key: "price",
      label: "Live Price (INR)",
      getValue: (p: ScoredProduct) => `₹${p.price.toLocaleString("en-IN")}`,
      getRaw: (p: ScoredProduct) => p.price,
      isNumeric: true,
      best: "min" as const
    },
    {
      key: "smartScore",
      label: "BuyWise Smart Score",
      getValue: (p: ScoredProduct) => `${p.score.overallScore} / 100`,
      getRaw: (p: ScoredProduct) => p.score.overallScore,
      isNumeric: true,
      best: "max" as const
    },
    {
      key: "rating",
      label: "Buyer Rating (Bayesian)",
      getValue: (p: ScoredProduct) => `${p.rating}★ (${p.reviewCount.toLocaleString()} reviews)`,
      getRaw: (p: ScoredProduct) => p.rating,
      isNumeric: true,
      best: "max" as const
    },
    {
      key: "store",
      label: "Retail Store",
      getValue: (p: ScoredProduct) => p.store,
      getRaw: (p: ScoredProduct) => p.store
    },
    {
      key: "delivery",
      label: "Est. Delivery",
      getValue: (p: ScoredProduct) => (p.deliveryDays ? `${p.deliveryDays} Days` : "Standard"),
      getRaw: (p: ScoredProduct) => p.deliveryDays || 3,
      isNumeric: true,
      best: "min" as const
    },
    {
      key: "priceVerdict",
      label: "Price History Verdict",
      getValue: (p: ScoredProduct) => p.priceVerdict.label,
      getRaw: (p: ScoredProduct) => p.priceVerdict.label
    }
  ];

  // Category specific spec rows
  const specRows = categoryAttrs.map(attr => ({
    key: `spec_${attr.key}`,
    label: attr.label,
    getValue: (p: ScoredProduct) => {
      const val = p.specs?.[attr.key];
      if (val === undefined || val === null) return "—";
      if (typeof val === "boolean") return val ? "Yes" : "No";
      return `${val} ${attr.unit || ""}`.trim();
    },
    getRaw: (p: ScoredProduct) => p.specs?.[attr.key] ?? null,
    isNumeric: products.some(p => typeof p.specs?.[attr.key] === "number"),
    best: attr.highlightBest
  }));

  const allRows = [...coreRows, ...specRows];

  // Filter rows if "only differences" is checked
  const filteredRows = allRows.filter(row => {
    if (!onlyDifferences) return true;
    const values = products.map(p => String(row.getRaw(p)));
    const allSame = values.every(v => v === values[0]);
    return !allSame;
  });

  return (
    <div className="w-full bg-surface border border-border rounded-lg p-5 sm:p-6 shadow-sm">
      {/* Table Header controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-border">
        <div>
          <h3 className="font-serif font-bold text-xl text-ink">
            Side-by-Side Comparison Matrix
          </h3>
          <p className="text-xs text-ink-secondary mt-0.5">
            Objective specification differences & calculated decision metrics
          </p>
        </div>

        {/* Show Only Differences Toggle */}
        <label className="flex items-center gap-2 text-xs font-medium text-ink cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onlyDifferences}
            onChange={(e) => setOnlyDifferences(e.target.checked)}
            className="rounded border-border text-brand-green focus:ring-brand-green accent-brand-green cursor-pointer"
          />
          <span>Show only differences</span>
        </label>
      </div>

      {/* Responsive Horizontal Scroll Container */}
      <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
        <table className="w-full text-left text-xs border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-border">
              <th className="p-3 bg-background text-ink-muted uppercase tracking-wider font-semibold w-1/4 sticky left-0 z-10 border-r border-border">
                Specification / Factor
              </th>
              {products.map((p, idx) => (
                <th key={p.id} className="p-3 bg-background text-ink font-semibold align-top w-1/4 border-r border-border last:border-r-0">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-ink-muted uppercase tracking-wider font-bold">
                      Option {idx + 1}
                    </span>
                    <span className="font-serif font-bold text-sm text-ink line-clamp-1 mt-0.5">
                      {p.brand} {p.title.split(" ").slice(1, 4).join(" ")}
                    </span>
                    <span className="font-mono font-bold text-brand-green mt-1 text-sm">
                      ₹{p.price.toLocaleString("en-IN")}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, rIdx) => {
              // Identify best value for highlight if defined
              let bestVal: any = null;
              if (row.best && row.isNumeric) {
                const numericVals = products
                  .map(p => Number(row.getRaw(p)))
                  .filter(v => !isNaN(v) && v !== null);

                if (numericVals.length > 0) {
                  bestVal = row.best === "min" ? Math.min(...numericVals) : Math.max(...numericVals);
                }
              }

              return (
                <tr
                  key={row.key}
                  className={`border-b border-border/60 hover:bg-background/50 transition-colors ${
                    rIdx % 2 === 0 ? "bg-surface" : "bg-background/20"
                  }`}
                >
                  <td className="p-3 font-medium text-ink-secondary sticky left-0 bg-surface z-10 border-r border-border">
                    {row.label}
                  </td>
                  {products.map(p => {
                    const displayVal = row.getValue(p);
                    const raw = row.getRaw(p);
                    const isBest = bestVal !== null && Number(raw) === bestVal;

                    return (
                      <td
                        key={p.id}
                        className={`p-3 text-ink font-sans border-r border-border last:border-r-0 ${
                          isBest ? "bg-brand-green-light/40 font-semibold text-brand-green" : ""
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {isBest && <CheckCircle2 className="w-3.5 h-3.5 text-brand-green flex-shrink-0" />}
                          <span>{displayVal}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
