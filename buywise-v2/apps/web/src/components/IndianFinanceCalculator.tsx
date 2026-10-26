"use client";

import React from "react";
import { calculateEffectiveIndianPrice } from "@buywise/shared";
import { CreditCard, Tag, Percent, CalendarClock } from "lucide-react";

interface IndianFinanceCalculatorProps {
  price: number;
}

export const IndianFinanceCalculator: React.FC<IndianFinanceCalculatorProps> = ({ price }) => {
  const finance = calculateEffectiveIndianPrice(price);

  return (
    <div className="w-full bg-surface border border-border rounded-lg p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-brand-green" />
          <h3 className="font-serif font-bold text-lg text-ink">
            India Price Reality: Bank Offers & EMI
          </h3>
        </div>
        <span className="text-[11px] font-mono text-ink-muted">
          Active Retail Promos
        </span>
      </div>

      {/* Effective Price Callout */}
      <div className="bg-brand-green-light/30 border border-brand-green/30 rounded p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs text-ink-secondary block font-medium">Effective Best Price with Bank Card:</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-bold font-mono text-brand-green tabular-nums">
              ₹{finance.effectivePrice.toLocaleString("en-IN")}
            </span>
            {finance.effectivePrice < price && (
              <span className="text-xs text-brand-green font-medium">
                (Save ₹{(price - finance.effectivePrice).toLocaleString("en-IN")})
              </span>
            )}
          </div>
        </div>

        {/* EMI breakdown */}
        <div className="flex items-center gap-4 text-xs font-mono border-t sm:border-t-0 sm:border-l border-border pt-2 sm:pt-0 sm:pl-4">
          <div>
            <span className="text-ink-muted block text-[10px]">3M No-Cost EMI</span>
            <span className="font-bold text-ink">₹{finance.monthlyEmi3m.toLocaleString("en-IN")}/mo</span>
          </div>
          <div>
            <span className="text-ink-muted block text-[10px]">6M No-Cost EMI</span>
            <span className="font-bold text-ink">₹{finance.monthlyEmi6m.toLocaleString("en-IN")}/mo</span>
          </div>
        </div>
      </div>

      {/* Available Bank Offers List */}
      <div className="space-y-2 text-xs">
        <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
          Current Applicable Bank Card Offers:
        </span>
        {finance.availableOffers.length > 0 ? (
          finance.availableOffers.map((offer, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded bg-background border border-border"
            >
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-brand-green" />
                <span className="font-semibold text-ink">{offer.bank}</span>
                <span className="text-ink-secondary">&bull; {offer.description}</span>
              </div>
              <span className="font-mono font-bold text-brand-green whitespace-nowrap">
                -₹{offer.amount.toLocaleString("en-IN")}
              </span>
            </div>
          ))
        ) : (
          <p className="text-ink-muted italic">
            Standard price applies. No bank discounts currently meet the minimum threshold for this item.
          </p>
        )}
      </div>
    </div>
  );
};
