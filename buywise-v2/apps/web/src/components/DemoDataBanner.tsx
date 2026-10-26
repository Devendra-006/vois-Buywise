"use client";

import React from "react";
import { Info, ExternalLink } from "lucide-react";

interface DemoDataBannerProps {
  isDemoData: boolean;
}

export const DemoDataBanner: React.FC<DemoDataBannerProps> = ({ isDemoData }) => {
  if (!isDemoData) return null;

  return (
    <div className="w-full bg-brand-amber-light/70 border border-brand-amber/30 rounded-lg p-3 sm:p-4 mb-6 text-xs text-ink flex items-start gap-3">
      <Info className="w-4 h-4 text-brand-amber flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <span className="font-semibold text-ink block sm:inline">
          Demo Fixture Mode Active:
        </span>{" "}
        <span className="text-ink-secondary">
          Displaying verified real snapshots saved from Indian e-commerce (Amazon, Flipkart, Croma). All prices, specs, and review counts reflect real market products without live API billing.
        </span>
      </div>
    </div>
  );
};
